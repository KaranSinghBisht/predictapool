// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {MockERC20} from "../src/tokens/MockERC20.sol";

/// @notice Step 1: Create a short-deadline demo event on a SEPARATE pool (different fee tier).
///         The main pool (fee=3000) has an active event, so we use fee=500 for the demo.
///         After deadline passes (~10min), run DemoResolveEvent.s.sol.
///         After 1hr settlement delay, run DemoSettleClaim.s.sol.
contract DemoCreateEvent is Script {
    address constant HOOK = 0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40;
    address constant POOL_MANAGER = 0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92;
    address constant TOKEN0 = 0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6;
    address constant TOKEN1 = 0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12;
    address constant SWAP_ROUTER = 0x9836796875956DEF7CED74C758f9E04682Dfbe2e;
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        PredictaPoolHook hook = PredictaPoolHook(HOOK);
        IPoolManager pm = IPoolManager(POOL_MANAGER);

        // Use fee=500, tickSpacing=10 to avoid PoolHasActiveEvent on the main pool
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 500,
            tickSpacing: 10,
            hooks: IHooks(HOOK)
        });

        bytes32 demoEventId = keccak256("DEMO_RESOLVED_EVENT");
        uint256 deadline = block.timestamp + 10 minutes;

        vm.startBroadcast(deployerKey);

        // Initialize a new pool with different fee tier
        pm.initialize(poolKey, SQRT_PRICE_1_1);
        console.log("Initialized demo pool (fee=500, tickSpacing=10)");

        // Mint tokens and approve
        MockERC20(TOKEN0).mint(deployer, 50_000e18);
        MockERC20(TOKEN1).mint(deployer, 50_000e18);
        IERC20(TOKEN0).approve(HOOK, type(uint256).max);
        IERC20(TOKEN1).approve(HOOK, type(uint256).max);
        IERC20(TOKEN0).approve(SWAP_ROUTER, type(uint256).max);
        IERC20(TOKEN1).approve(SWAP_ROUTER, type(uint256).max);

        // Create demo event with 10-minute deadline
        hook.createEvent(demoEventId, "Demo: France vs Germany", 3, deadline, poolKey);
        console.log("Created demo event, deadline:", deadline);

        // Predict
        hook.predict(demoEventId, 0, 5000e18, 5000e18);
        console.log("Predicted: France wins with 5000 each");

        // Swap to generate yield
        PoolSwapTest swapRouter = PoolSwapTest(SWAP_ROUTER);
        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1000e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            settings,
            ""
        );

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -1000e18, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            settings,
            ""
        );
        console.log("Swaps complete (2x 1000 tokens)");

        vm.stopBroadcast();

        console.log("Demo Event ID:", vm.toString(demoEventId));
        console.log("Next: wait ~10 min for deadline, then run DemoResolveEvent.s.sol");
    }
}
