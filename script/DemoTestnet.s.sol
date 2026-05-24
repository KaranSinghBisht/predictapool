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

contract DemoTestnet is Script {
    address constant HOOK = 0x670a7A315fcfeE9D29E264DC37f60D2b7CfACa40;
    address constant TOKEN0 = 0x1af558Ba6fDfdDDF7C971708572669578bfB4368;
    address constant TOKEN1 = 0x356d9E5e2a9EBBf67E9731de36bA1d333761b9fA;
    address constant SWAP_ROUTER = 0xB920A2A12d24A555c3c74802Ff8a9DdF41EeB5e9;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        PredictaPoolHook hook = PredictaPoolHook(HOOK);
        bytes32 eventId = keccak256("FIFA_ARG_vs_BRA_2026");

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        vm.startBroadcast(deployerKey);

        // Approve tokens to Hook and SwapRouter
        IERC20(TOKEN0).approve(HOOK, type(uint256).max);
        IERC20(TOKEN1).approve(HOOK, type(uint256).max);
        IERC20(TOKEN0).approve(SWAP_ROUTER, type(uint256).max);
        IERC20(TOKEN1).approve(SWAP_ROUTER, type(uint256).max);

        // Predict: outcome 0 = Argentina wins, 5000 tokens each
        hook.predict(eventId, 0, 5000e18, 5000e18);
        console.log("Predicted: Argentina wins with 5000 each token");

        // Swap to generate yield
        PoolSwapTest swapRouter = PoolSwapTest(SWAP_ROUTER);
        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -500e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            settings,
            ""
        );
        console.log("Swap 1: 500 token0 -> token1");

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -500e18, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            settings,
            ""
        );
        console.log("Swap 2: 500 token1 -> token0");

        vm.stopBroadcast();

        (,,,,,,, uint256 dep0, uint256 dep1,,, uint256 swapCount) = hook.getEvent(eventId);
        console.log("Total deposits token0:", dep0);
        console.log("Total deposits token1:", dep1);
        console.log("Swap count:", swapCount);
        console.log("Demo complete - event resolves after deadline passes");
    }
}
