// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";

import {MockERC20} from "../src/tokens/MockERC20.sol";
import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {HookMiner} from "./utils/HookDeployer.sol";

/// @notice Tests for the v2 hook behaviour: deadline-aware dynamic fee, lifecycle
/// gating of swaps, and per-swap yield telemetry. Uses a DYNAMIC-fee pool.
contract PredictaPoolHookV2Test is Test {
    PoolManager poolManager;
    PredictaPoolHook hook;
    PoolSwapTest swapRouter;

    MockERC20 tokenA;
    MockERC20 tokenB;
    Currency currency0;
    Currency currency1;
    PoolKey poolKey;

    address alice = makeAddr("alice");

    bytes32 constant EVENT_ID = keccak256("ARG_vs_BRA_2026_DYN");
    uint256 constant INITIAL_BALANCE = 100_000e18;
    uint256 constant DEPOSIT = 1_000e18;
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    uint24 constant BASE_FEE_PIPS = 3000;
    uint24 constant PEAK_FEE_PIPS = 10000;
    uint256 constant RAMP = 7 days;

    event YieldBoosted(bytes32 indexed eventId, address indexed swapper, uint24 feePips, uint256 swapCount);

    function setUp() public {
        vm.warp(1000);
        poolManager = new PoolManager(address(this));

        tokenA = new MockERC20("Mock USDC", "USDC", 18);
        tokenB = new MockERC20("Mock WETH", "WETH", 18);
        if (address(tokenA) > address(tokenB)) (tokenA, tokenB) = (tokenB, tokenA);
        currency0 = Currency.wrap(address(tokenA));
        currency1 = Currency.wrap(address(tokenB));

        uint160 flags = uint160(
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.BEFORE_SWAP_FLAG
                | Hooks.AFTER_SWAP_FLAG
        );
        (address hookAddr, bytes32 salt) =
            HookMiner.find(address(this), flags, type(PredictaPoolHook).creationCode, abi.encode(address(poolManager)));
        hook = new PredictaPoolHook{salt: salt}(poolManager);
        assertEq(address(hook), hookAddr, "hook address mismatch");

        swapRouter = new PoolSwapTest(poolManager);

        // DYNAMIC-fee pool: the hook decides the fee per swap.
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        poolManager.initialize(poolKey, SQRT_PRICE_1_1);

        _fund(alice);
        tokenA.mint(address(this), INITIAL_BALANCE);
        tokenB.mint(address(this), INITIAL_BALANCE);
        tokenA.approve(address(swapRouter), type(uint256).max);
        tokenB.approve(address(swapRouter), type(uint256).max);
    }

    function _fund(address user) internal {
        tokenA.mint(user, INITIAL_BALANCE);
        tokenB.mint(user, INITIAL_BALANCE);
        vm.startPrank(user);
        tokenA.approve(address(hook), type(uint256).max);
        tokenB.approve(address(hook), type(uint256).max);
        vm.stopPrank();
    }

    function _createEvent(uint256 deadline) internal {
        hook.createEvent(EVENT_ID, "Argentina vs Brazil", 3, deadline, poolKey);
    }

    function _seedLiquidity() internal {
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);
    }

    function _doSwap(bool zeroForOne, int256 amount) internal {
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amount,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );
    }

    function _swapCount() internal view returns (uint256 swapCount) {
        (string memory name, uint8 numOutcomes,, bool resolved, bool settled,, uint256 deadline,,,,, uint256 sc) =
            hook.getEvent(EVENT_ID);
        name;
        numOutcomes;
        resolved;
        settled;
        deadline;
        swapCount = sc;
    }

    // ─── Dynamic fee ────────────────────────────────────────────────────

    function test_v2_feeIsBaseFarFromDeadline() public {
        _createEvent(block.timestamp + 8 days); // remaining > RAMP
        assertEq(hook.currentFeePips(EVENT_ID), BASE_FEE_PIPS);
    }

    function test_v2_feeRampsTowardDeadline() public {
        _createEvent(block.timestamp + 5 days); // 2 days into the 7-day ramp
        uint24 feeAtFive = hook.currentFeePips(EVENT_ID);
        assertEq(feeAtFive, BASE_FEE_PIPS + uint24((uint256(PEAK_FEE_PIPS - BASE_FEE_PIPS) * 2 days) / RAMP));
        assertGt(feeAtFive, BASE_FEE_PIPS);
        assertLt(feeAtFive, PEAK_FEE_PIPS);

        vm.warp(block.timestamp + 3 days); // now 2 days from deadline
        uint24 feeAtTwo = hook.currentFeePips(EVENT_ID);
        assertGt(feeAtTwo, feeAtFive); // fee climbs as kickoff nears
    }

    function test_v2_feePeaksAtDeadline() public {
        _createEvent(block.timestamp + 1 days);
        vm.warp(block.timestamp + 1 days + 1); // past deadline
        assertEq(hook.currentFeePips(EVENT_ID), PEAK_FEE_PIPS);
    }

    // ─── Swaps apply the override + emit telemetry ──────────────────────

    function test_v2_swapSucceedsOnDynamicPoolAndCounts() public {
        _createEvent(block.timestamp + 5 days);
        _seedLiquidity();
        _doSwap(true, -1e18); // succeeds only if the hook's fee override is accepted
        assertEq(_swapCount(), 1);
    }

    function test_v2_swapEmitsYieldBoosted() public {
        _createEvent(block.timestamp + 5 days);
        _seedLiquidity();
        vm.expectEmit(true, false, false, false, address(hook)); // check eventId topic only
        emit YieldBoosted(EVENT_ID, address(0), 0, 0);
        _doSwap(true, -1e18);
    }

    function test_v2_multipleSwapsIncrementCount() public {
        _createEvent(block.timestamp + 5 days);
        _seedLiquidity();
        _doSwap(true, -1e18);
        _doSwap(false, -1e18);
        _doSwap(true, -1e18);
        assertEq(_swapCount(), 3);
    }

    // ─── Lifecycle gate ─────────────────────────────────────────────────

    function test_v2_tradingClosedAfterResolve() public {
        _createEvent(block.timestamp + 1 days);
        _seedLiquidity();
        vm.warp(block.timestamp + 1 days + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.expectRevert(); // beforeSwap reverts TradingClosed
        _doSwap(true, -1e18);
    }

    function test_v2_tradingClosedAfterSettle() public {
        _createEvent(block.timestamp + 1 days);
        _seedLiquidity();
        vm.warp(block.timestamp + 1 days + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);
        vm.expectRevert();
        _doSwap(true, -1e18);
    }

    function test_v2_tradingClosedAfterCancel() public {
        _createEvent(block.timestamp + 1 days);
        _seedLiquidity();
        vm.warp(block.timestamp + 1 days + 1);
        hook.cancelEvent(EVENT_ID);
        vm.expectRevert();
        _doSwap(true, -1e18);
    }

    function test_v2_swapsAllowedBeforeResolve() public {
        _createEvent(block.timestamp + 1 days);
        _seedLiquidity();
        vm.warp(block.timestamp + 1 days + 1); // past deadline but not resolved
        _doSwap(true, -1e18); // still allowed until resolution
        assertEq(_swapCount(), 1);
    }
}
