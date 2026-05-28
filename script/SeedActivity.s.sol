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

/// @notice Seeds the LIVE Argentina vs Brazil event with a realistic 3-way
///         deposit distribution (via two helper wallets) plus a batch of swaps
///         to generate visible on-chain trading activity. All real on-chain.
contract SeedActivity is Script {
    address constant HOOK = 0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40;
    address constant TOKEN0 = 0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6;
    address constant TOKEN1 = 0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12;
    address constant SWAP_ROUTER = 0x9836796875956DEF7CED74C758f9E04682Dfbe2e;
    bytes32 constant EVENT_ID = 0x7e62176d34f6ec0157e28f14dc9d431dfedc1dff4cfe9fab73c5c259186e8864;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        uint256 keyA = uint256(keccak256("predictapool-seed-helper-a"));
        uint256 keyB = uint256(keccak256("predictapool-seed-helper-b"));
        address helperA = vm.addr(keyA);
        address helperB = vm.addr(keyB);

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(TOKEN0),
            currency1: Currency.wrap(TOKEN1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        PredictaPoolHook hook = PredictaPoolHook(HOOK);

        // 1. Deployer funds helpers with gas + mints tokens to everyone
        vm.startBroadcast(deployerKey);
        payable(helperA).transfer(0.03 ether);
        payable(helperB).transfer(0.03 ether);
        MockERC20(TOKEN0).mint(helperA, 10_000e18);
        MockERC20(TOKEN1).mint(helperA, 10_000e18);
        MockERC20(TOKEN0).mint(helperB, 10_000e18);
        MockERC20(TOKEN1).mint(helperB, 10_000e18);
        MockERC20(TOKEN0).mint(deployer, 50_000e18);
        MockERC20(TOKEN1).mint(deployer, 50_000e18);
        IERC20(TOKEN0).approve(SWAP_ROUTER, type(uint256).max);
        IERC20(TOKEN1).approve(SWAP_ROUTER, type(uint256).max);
        vm.stopBroadcast();

        // 2. Helper A predicts Draw (outcome 1) with 2000 each
        vm.startBroadcast(keyA);
        IERC20(TOKEN0).approve(HOOK, type(uint256).max);
        IERC20(TOKEN1).approve(HOOK, type(uint256).max);
        hook.predict(EVENT_ID, 1, 2000e18, 2000e18);
        vm.stopBroadcast();

        // 3. Helper B predicts Brazil (outcome 2) with 4000 each
        vm.startBroadcast(keyB);
        IERC20(TOKEN0).approve(HOOK, type(uint256).max);
        IERC20(TOKEN1).approve(HOOK, type(uint256).max);
        hook.predict(EVENT_ID, 2, 4000e18, 4000e18);
        vm.stopBroadcast();

        // 4. Deployer runs a batch of swaps to bump swapCount + generate fees
        vm.startBroadcast(deployerKey);
        PoolSwapTest swapRouter = PoolSwapTest(SWAP_ROUTER);
        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});
        for (uint256 i = 0; i < 12; i++) {
            bool zeroForOne = i % 2 == 0;
            swapRouter.swap(
                poolKey,
                IPoolManager.SwapParams({
                    zeroForOne: zeroForOne,
                    amountSpecified: -300e18,
                    sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
                }),
                settings,
                ""
            );
        }
        vm.stopBroadcast();

        console.log("Seeding complete. Distribution: ARG 5000 / Draw 2000 / Brazil 4000, +12 swaps");
    }
}
