// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {MockERC20} from "../src/tokens/MockERC20.sol";
import {HookMiner, HookFactory} from "../test/utils/HookDeployer.sol";

contract DeployTestnet is Script {
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy PoolManager (no V4 on X Layer testnet)
        PoolManager poolManager = new PoolManager(deployer);
        console.log("PoolManager:", address(poolManager));

        // 2. Deploy test tokens
        MockERC20 usdc = new MockERC20("PredictaPool USDC", "ppUSDC", 18);
        MockERC20 weth = new MockERC20("PredictaPool WETH", "ppWETH", 18);

        address token0Addr;
        address token1Addr;
        if (address(usdc) < address(weth)) {
            token0Addr = address(usdc);
            token1Addr = address(weth);
        } else {
            token0Addr = address(weth);
            token1Addr = address(usdc);
        }

        // 3. Deploy Hook via CREATE2 (factory pattern)
        HookFactory factory = new HookFactory();

        uint160 flags =
            uint160(Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG);

        (address hookAddr, bytes32 salt) = HookMiner.find(
            address(factory), flags, type(PredictaPoolHook).creationCode, abi.encode(address(poolManager))
        );

        PredictaPoolHook hook = factory.deploy(IPoolManager(address(poolManager)), salt, deployer);
        require(address(hook) == hookAddr, "Hook address mismatch");

        // 4. Deploy SwapRouter
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(address(poolManager)));

        // 5. Set up PoolKey and initialize pool
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0Addr),
            currency1: Currency.wrap(token1Addr),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(hookAddr)
        });

        poolManager.initialize(poolKey, SQRT_PRICE_1_1);

        // 6. Mint test tokens
        usdc.mint(deployer, 100_000e18);
        weth.mint(deployer, 100_000e18);

        // 7. Create prediction event (deadline in 5 days)
        bytes32 eventId = keccak256("FIFA_ARG_vs_BRA_2026");
        hook.createEvent(eventId, "Argentina vs Brazil - FIFA 2026", 3, block.timestamp + 5 days, poolKey);

        vm.stopBroadcast();

        console.log("=== X LAYER TESTNET DEPLOYMENT ===");
        console.log("PoolManager:", address(poolManager));
        console.log("Hook:", address(hook));
        console.log("SwapRouter:", address(swapRouter));
        console.log("Token0:", token0Addr);
        console.log("Token1:", token1Addr);
        console.log("Event ID:", vm.toString(eventId));
    }
}
