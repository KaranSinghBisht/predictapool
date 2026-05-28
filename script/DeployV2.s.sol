// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {MockERC20} from "../src/tokens/MockERC20.sol";
import {HookMiner, HookFactory} from "../test/utils/HookDeployer.sol";

/// @notice Deploys PredictaPool Hook v2 (dynamic-fee + lifecycle hook) reusing the
/// existing v1 PoolManager + tokens + router on X Layer testnet. Only a new hook and
/// a new dynamic-fee pool are created, so the funded demo wallet's tokens still work.
contract DeployV2 is Script {
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    // Existing v1 infra (X Layer testnet, chain 1952).
    address constant POOL_MANAGER = 0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92;
    address constant TOKEN0 = 0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6; // ppUSDC
    address constant TOKEN1 = 0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12; // ppWETH
    address constant SWAP_ROUTER = 0x9836796875956DEF7CED74C758f9E04682Dfbe2e;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        IPoolManager pm = IPoolManager(POOL_MANAGER);

        vm.startBroadcast(deployerKey);

        // 1. Deploy v2 hook (beforeSwap now enabled) at a freshly mined CREATE2 address.
        HookFactory factory = new HookFactory();
        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG
                | Hooks.AFTER_SWAP_FLAG
        );
        (address hookAddr, bytes32 salt) =
            HookMiner.find(address(factory), flags, type(PredictaPoolHook).creationCode, abi.encode(POOL_MANAGER));
        PredictaPoolHook hook = factory.deploy(pm, salt, deployer);
        require(address(hook) == hookAddr, "hook addr mismatch");

        // 2. Initialize a DYNAMIC-FEE pool governed by the v2 hook.
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(hookAddr)
        });
        pm.initialize(poolKey, SQRT_PRICE_1_1);

        // 3. Create the live event (deadline 5 days out -> fee sits mid-ramp).
        bytes32 eventId = keccak256("FIFA_ARG_vs_BRA_2026_V2");
        hook.createEvent(eventId, "Argentina vs Brazil - FIFA 2026", 3, block.timestamp + 5 days, poolKey);

        // 4. Seed liquidity: deployer predicts Argentina so the pool can be swapped.
        MockERC20(TOKEN0).mint(deployer, 20_000e18);
        MockERC20(TOKEN1).mint(deployer, 20_000e18);
        MockERC20(TOKEN0).approve(address(hook), type(uint256).max);
        MockERC20(TOKEN1).approve(address(hook), type(uint256).max);
        hook.predict(eventId, 0, 5_000e18, 5_000e18);

        // 5. Fire two swaps through the router so the dynamic fee + YieldBoosted
        //    telemetry are live and verifiable from block one.
        PoolSwapTest router = PoolSwapTest(SWAP_ROUTER);
        MockERC20(TOKEN0).approve(SWAP_ROUTER, type(uint256).max);
        MockERC20(TOKEN1).approve(SWAP_ROUTER, type(uint256).max);
        PoolSwapTest.TestSettings memory ts = PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});
        router.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -25e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            ts,
            ""
        );
        router.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -25e18, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            ts,
            ""
        );

        vm.stopBroadcast();

        console.log("=== PREDICTAPOOL V2 (dynamic-fee hook) ===");
        console.log("Hook v2:", address(hook));
        console.log("Pool fee flag (dynamic):", LPFeeLibrary.DYNAMIC_FEE_FLAG);
        console.log("Event ID:", vm.toString(eventId));
        console.log("Current fee (pips):", hook.currentFeePips(eventId));
    }
}
