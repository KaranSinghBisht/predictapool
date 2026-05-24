// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";

contract Demo is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        address hookAddr = vm.envAddress("HOOK_ADDRESS");
        address token0Addr = vm.envAddress("TOKEN0_ADDRESS");
        address token1Addr = vm.envAddress("TOKEN1_ADDRESS");
        address swapRouterAddr = vm.envAddress("SWAP_ROUTER_ADDRESS");

        PredictaPoolHook hook = PredictaPoolHook(hookAddr);
        bytes32 eventId = keccak256("FIFA_ARG_vs_BRA_2026");

        vm.startBroadcast(deployerKey);

        // Approve tokens
        IERC20(token0Addr).approve(hookAddr, type(uint256).max);
        IERC20(token1Addr).approve(hookAddr, type(uint256).max);
        IERC20(token0Addr).approve(swapRouterAddr, type(uint256).max);
        IERC20(token1Addr).approve(swapRouterAddr, type(uint256).max);

        // Make a prediction: outcome 0 = Argentina wins
        hook.predict(eventId, 0, 1000e18, 1000e18);

        // Execute some swaps to generate yield
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0Addr),
            currency1: Currency.wrap(token1Addr),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(hookAddr)
        });

        PoolSwapTest swapRouter = PoolSwapTest(swapRouterAddr);
        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -100e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            settings,
            ""
        );

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -100e18, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            settings,
            ""
        );

        // Resolve: Argentina wins (outcome 0)
        hook.resolveEvent(eventId, 0);

        // Settle the event (remove LP)
        hook.settleEvent(eventId);

        // Claim winnings
        hook.claim(eventId);

        vm.stopBroadcast();
    }
}
