// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {MockERC20} from "../src/tokens/MockERC20.sol";
import {HookMiner, HookFactory} from "../test/utils/HookDeployer.sol";

contract DeployLocal is Script {
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // ── 1. Deploy PoolManager ────────────────────────────────────
        PoolManager poolManager = new PoolManager(deployer);
        console.log("PoolManager:", address(poolManager));

        // ── 2. Deploy test tokens ────────────────────────────────────
        MockERC20 tokenA = new MockERC20("PredictaPool USDC", "ppUSDC", 18);
        MockERC20 tokenB = new MockERC20("PredictaPool WETH", "ppWETH", 18);
        console.log("TokenA:", address(tokenA));
        console.log("TokenB:", address(tokenB));

        // Sort tokens
        if (address(tokenA) > address(tokenB)) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        address token0 = address(tokenA);
        address token1 = address(tokenB);
        console.log("Token0 (sorted):", token0);
        console.log("Token1 (sorted):", token1);

        // ── 3. Deploy Hook via CREATE2 (factory pattern) ─────────────
        HookFactory factory = new HookFactory();
        console.log("HookFactory:", address(factory));

        uint160 flags =
            uint160(Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG);

        (address hookAddr, bytes32 salt) = HookMiner.find(
            address(factory), flags, type(PredictaPoolHook).creationCode, abi.encode(address(poolManager))
        );

        PredictaPoolHook hook = factory.deploy(IPoolManager(address(poolManager)), salt, deployer);
        require(address(hook) == hookAddr, "Hook address mismatch");
        console.log("Hook:", address(hook));

        // ── 4. Deploy SwapRouter ─────────────────────────────────────
        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(address(poolManager)));
        console.log("SwapRouter:", address(swapRouter));

        // ── 5. Initialize Pool ───────────────────────────────────────
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        poolManager.initialize(poolKey, SQRT_PRICE_1_1);
        console.log("Pool initialized at 1:1 price");

        // ── 6. Mint tokens ───────────────────────────────────────────
        tokenA.mint(deployer, 100_000e18);
        tokenB.mint(deployer, 100_000e18);
        tokenA.approve(address(hook), type(uint256).max);
        tokenB.approve(address(hook), type(uint256).max);
        tokenA.approve(address(swapRouter), type(uint256).max);
        tokenB.approve(address(swapRouter), type(uint256).max);

        // ── 7. Create prediction event ───────────────────────────────
        bytes32 eventId = keccak256("FIFA_ARG_vs_BRA_2026");
        hook.createEvent(eventId, "Argentina vs Brazil - FIFA 2026", 3, block.timestamp + 1 days, poolKey);
        console.log("Event created: Argentina vs Brazil");

        // ── 8. Make prediction ───────────────────────────────────────
        hook.predict(eventId, 0, 5000e18, 5000e18);
        console.log("Predicted: outcome 0 (Argentina wins) with 5000 each token");

        // ── 9. Execute swaps to generate yield ───────────────────────
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

        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -200e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            settings,
            ""
        );
        console.log("Swap 3: 200 token0 -> token1");

        // ── 10. Check event state ────────────────────────────────────
        (,,,,,, uint256 dep0, uint256 dep1,,, uint256 swapCount) = hook.getEvent(eventId);
        console.log("Total deposits token0:", dep0);
        console.log("Total deposits token1:", dep1);
        console.log("Swap count:", swapCount);

        // ── 11. Resolve event (warp past deadline) ─────────────────
        vm.warp(block.timestamp + 2 days);
        hook.resolveEvent(eventId, 0);
        console.log("Event resolved: Argentina wins (outcome 0)");

        // ── 12. Settle event (remove LP) ─────────────────────────────
        hook.settleEvent(eventId);

        (,,,,,,,, uint256 ret0, uint256 ret1,) = hook.getEvent(eventId);
        console.log("Total return token0:", ret0);
        console.log("Total return token1:", ret1);

        uint256 yield0 = ret0 > dep0 ? ret0 - dep0 : 0;
        uint256 yield1 = ret1 > dep1 ? ret1 - dep1 : 0;
        console.log("Yield earned token0:", yield0);
        console.log("Yield earned token1:", yield1);

        // ── 13. Claim ────────────────────────────────────────────────
        uint256 bal0Before = tokenA.balanceOf(deployer);
        uint256 bal1Before = tokenB.balanceOf(deployer);

        hook.claim(eventId);

        uint256 payout0 = tokenA.balanceOf(deployer) - bal0Before;
        uint256 payout1 = tokenB.balanceOf(deployer) - bal1Before;
        console.log("Claimed payout token0:", payout0);
        console.log("Claimed payout token1:", payout1);

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("PoolManager:", address(poolManager));
        console.log("Hook:", address(hook));
        console.log("SwapRouter:", address(swapRouter));
        console.log("Token0:", token0);
        console.log("Token1:", token1);
    }
}
