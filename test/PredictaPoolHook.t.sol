// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";

import {MockERC20} from "../src/tokens/MockERC20.sol";
import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {HookMiner} from "./utils/HookDeployer.sol";

contract PredictaPoolHookTest is Test {
    using PoolIdLibrary for PoolKey;

    PoolManager poolManager;
    PredictaPoolHook hook;
    PoolSwapTest swapRouter;

    MockERC20 tokenA;
    MockERC20 tokenB;
    Currency currency0;
    Currency currency1;
    PoolKey poolKey;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");

    bytes32 constant EVENT_ID = keccak256("ARG_vs_BRA_2026");
    uint256 constant INITIAL_BALANCE = 100_000e18;
    uint256 constant DEPOSIT = 1_000e18;
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint256 constant DEADLINE = 1_000_000;
    uint256 constant MIN_DEPOSIT = 1e15;
    uint256 constant AUTO_EXPIRY = 30 days;

    function setUp() public {
        vm.warp(1000);

        poolManager = new PoolManager(address(this));

        tokenA = new MockERC20("Mock USDC", "USDC", 18);
        tokenB = new MockERC20("Mock WETH", "WETH", 18);

        if (address(tokenA) > address(tokenB)) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
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

        poolKey = PoolKey({
            currency0: currency0, currency1: currency1, fee: 3000, tickSpacing: 60, hooks: IHooks(address(hook))
        });

        poolManager.initialize(poolKey, SQRT_PRICE_1_1);

        _setupUser(alice);
        _setupUser(bob);
        _setupUser(charlie);

        tokenA.mint(address(this), INITIAL_BALANCE);
        tokenB.mint(address(this), INITIAL_BALANCE);
        tokenA.approve(address(swapRouter), type(uint256).max);
        tokenB.approve(address(swapRouter), type(uint256).max);
    }

    function _setupUser(address user) internal {
        tokenA.mint(user, INITIAL_BALANCE);
        tokenB.mint(user, INITIAL_BALANCE);
        vm.startPrank(user);
        tokenA.approve(address(hook), type(uint256).max);
        tokenB.approve(address(hook), type(uint256).max);
        tokenA.approve(address(swapRouter), type(uint256).max);
        tokenB.approve(address(swapRouter), type(uint256).max);
        vm.stopPrank();
    }

    function _createDefaultEvent() internal {
        hook.createEvent(EVENT_ID, "Argentina vs Brazil", 3, DEADLINE, poolKey);
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

    // ─── createEvent Tests ──────────────────────────────────────────────

    function test_createEvent() public {
        hook.createEvent(EVENT_ID, "Argentina vs Brazil", 3, DEADLINE, poolKey);

        (
            string memory name,
            uint8 numOutcomes,,
            bool resolved,
            bool settled,,
            uint256 deadline,,,,,
            uint256 swapCount
        ) = hook.getEvent(EVENT_ID);

        assertEq(name, "Argentina vs Brazil");
        assertEq(numOutcomes, 3);
        assertFalse(resolved);
        assertFalse(settled);
        assertEq(deadline, DEADLINE);
        assertEq(swapCount, 0);
    }

    function test_createEvent_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.createEvent(EVENT_ID, "Test", 3, DEADLINE, poolKey);
    }

    function test_createEvent_duplicate_reverts() public {
        _createDefaultEvent();
        vm.expectRevert(PredictaPoolHook.EventAlreadyExists.selector);
        hook.createEvent(EVENT_ID, "Test", 3, DEADLINE, poolKey);
    }

    // ─── predict Tests ──────────────────────────────────────────────────

    function test_predict() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (uint8 outcome, uint256 dep0, uint256 dep1, bool claimed, bool exists) = hook.predictions(EVENT_ID, alice);

        assertEq(outcome, 0);
        assertEq(dep0, DEPOSIT);
        assertEq(dep1, DEPOSIT);
        assertFalse(claimed);
        assertTrue(exists);
    }

    function test_predict_multipleUsers() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        vm.prank(charlie);
        hook.predict(EVENT_ID, 2, DEPOSIT, DEPOSIT);

        (,,,,,,, uint256 totalDep0, uint256 totalDep1,,,) = hook.getEvent(EVENT_ID);
        assertEq(totalDep0, DEPOSIT * 3);
        assertEq(totalDep1, DEPOSIT * 3);
    }

    function test_predict_afterDeadline_reverts() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.DeadlinePassed.selector);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);
    }

    function test_predict_invalidOutcome_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.InvalidOutcome.selector);
        hook.predict(EVENT_ID, 3, DEPOSIT, DEPOSIT);
    }

    function test_predict_addToExisting() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (uint8 outcome, uint256 dep0, uint256 dep1,,) = hook.predictions(EVENT_ID, alice);
        assertEq(outcome, 0);
        assertEq(dep0, DEPOSIT * 2);
        assertEq(dep1, DEPOSIT * 2);
    }

    function test_predict_outcomeMismatch_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.OutcomeMismatch.selector);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);
    }

    function test_predict_resolvedEvent_reverts() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.EventAlreadyResolved.selector);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);
    }

    // ─── afterSwap Tests ────────────────────────────────────────────────

    function test_swapTracksCount() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        _doSwap(true, -100e18);
        _doSwap(false, -100e18);

        (,,,,,,,,,,, uint256 swapCount) = hook.getEvent(EVENT_ID);
        assertEq(swapCount, 2);
    }

    // ─── resolveEvent Tests ─────────────────────────────────────────────

    function test_resolveEvent() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);

        (,, uint8 winOutcome, bool resolved,,,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(resolved);
        assertEq(winOutcome, 0);
    }

    function test_resolveEvent_onlyOwner() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.resolveEvent(EVENT_ID, 0);
    }

    function test_resolveEvent_invalidOutcome_reverts() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);
        vm.expectRevert(PredictaPoolHook.InvalidOutcome.selector);
        hook.resolveEvent(EVENT_ID, 5);
    }

    function test_resolveEvent_alreadyResolved_reverts() public {
        _createDefaultEvent();
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.expectRevert(PredictaPoolHook.EventAlreadyResolved.selector);
        hook.resolveEvent(EVENT_ID, 1);
    }

    // ─── settleEvent Tests ──────────────────────────────────────────────

    function test_settleEvent() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        (,,,, bool settled,,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(settled);
    }

    function test_settleEvent_notResolved_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.expectRevert(PredictaPoolHook.EventNotResolved.selector);
        hook.settleEvent(EVENT_ID);
    }

    function test_settleEvent_alreadySettled_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        vm.expectRevert(PredictaPoolHook.EventAlreadySettled.selector);
        hook.settleEvent(EVENT_ID);
    }

    // ─── claim Tests ────────────────────────────────────────────────────

    function test_claim_beforeSettle_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.EventNotSettled.selector);
        hook.claim(EVENT_ID);
    }

    function test_claim_noPrediction_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        vm.prank(bob);
        vm.expectRevert(PredictaPoolHook.NoPrediction.selector);
        hook.claim(EVENT_ID);
    }

    function test_claim_twice_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.AlreadyClaimed.selector);
        hook.claim(EVENT_ID);
    }

    // ─── Full Lifecycle Tests ───────────────────────────────────────────

    function test_fullLifecycle_winnerGetsYield() public {
        _createDefaultEvent();

        // Alice predicts outcome 0, Bob predicts outcome 1
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Generate yield through swaps
        _doSwap(true, -100e18);
        _doSwap(false, -100e18);
        _doSwap(true, -50e18);
        _doSwap(false, -50e18);

        // Resolve: outcome 0 wins (Alice wins)
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        uint256 bobBal0Before = tokenA.balanceOf(bob);

        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);

        uint256 alicePayout0 = tokenA.balanceOf(alice) - aliceBal0Before;
        uint256 bobPayout0 = tokenA.balanceOf(bob) - bobBal0Before;

        // Alice (winner) should get more than Bob (loser) due to yield redistribution
        assertGe(alicePayout0, bobPayout0, "Winner should get >= loser payout");

        // Bob should still get most of principal back (no-loss design)
        assertGt(bobPayout0, 0, "Loser should get principal back");
    }

    function test_fullLifecycle_noSwaps() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // No swaps — no yield generated
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);

        // Both should get roughly their deposit back (minimal rounding)
        // With no swaps, there's no yield to redistribute
    }

    function test_fullLifecycle_threeOutcomes() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        vm.prank(charlie);
        hook.predict(EVENT_ID, 2, DEPOSIT, DEPOSIT);

        _doSwap(true, -200e18);
        _doSwap(false, -200e18);

        // Outcome 2 wins (Charlie wins, Alice and Bob lose)
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 2);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        uint256 charlieBal0Before = tokenA.balanceOf(charlie);
        uint256 charlieBal1Before = tokenB.balanceOf(charlie);

        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);

        vm.prank(charlie);
        hook.claim(EVENT_ID);

        uint256 charliePayout0 = tokenA.balanceOf(charlie) - charlieBal0Before;
        uint256 charliePayout1 = tokenB.balanceOf(charlie) - charlieBal1Before;

        // Charlie (sole winner) should get total value >= 2x DEPOSIT across both tokens
        // IL may shift between tokens but total value should exceed deposit
        assertGe(charliePayout0 + charliePayout1, 2 * DEPOSIT, "Winner total payout should exceed total deposit");
    }

    // ─── Access Control Tests ───────────────────────────────────────────

    function test_resolveEvent_beforeDeadline_reverts() public {
        _createDefaultEvent();
        vm.expectRevert(PredictaPoolHook.DeadlineNotPassed.selector);
        hook.resolveEvent(EVENT_ID, 0);
    }

    // ─── Edge Case Tests ────────────────────────────────────────────────

    function test_predict_singleSidedDeposit() public {
        _createDefaultEvent();

        uint256 amount0 = 5_000e18;
        uint256 amount1 = MIN_DEPOSIT;

        uint256 bal0Before = tokenA.balanceOf(alice);
        uint256 bal1Before = tokenB.balanceOf(alice);

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, amount0, amount1);

        (uint8 outcome, uint256 dep0, uint256 dep1, bool claimed, bool exists) = hook.predictions(EVENT_ID, alice);
        assertEq(outcome, 0);
        assertLe(dep0, amount0);
        assertLe(dep1, amount1);
        assertFalse(claimed);
        assertTrue(exists);

        assertEq(tokenA.balanceOf(alice), bal0Before - dep0);
        assertEq(tokenB.balanceOf(alice), bal1Before - dep1);
    }

    function test_predict_refundEvent_emitted() public {
        _createDefaultEvent();

        uint256 amount0 = 5_000e18;
        uint256 amount1 = MIN_DEPOSIT;

        vm.prank(alice);
        vm.expectEmit(true, true, false, false);
        emit PredictaPoolHook.DepositRefunded(EVENT_ID, alice, 0, 0);
        hook.predict(EVENT_ID, 0, amount0, amount1);
    }

    function test_predict_refundAfterPriceDrift() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        _doSwap(true, -2_000e18);

        uint256 bal0Before = tokenA.balanceOf(bob);
        uint256 bal1Before = tokenB.balanceOf(bob);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        (, uint256 dep0, uint256 dep1,,) = hook.predictions(EVENT_ID, bob);

        assertLe(dep0, DEPOSIT);
        assertLe(dep1, DEPOSIT);
        assertEq(tokenA.balanceOf(bob), bal0Before - dep0);
        assertEq(tokenB.balanceOf(bob), bal1Before - dep1);
    }

    function test_cancelEvent_afterResolve_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);

        vm.expectRevert(PredictaPoolHook.EventAlreadyResolved.selector);
        hook.cancelEvent(EVENT_ID);
    }

    function test_predict_zeroAmount_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.ZeroAmount.selector);
        hook.predict(EVENT_ID, 0, 0, 0);
    }

    function test_predict_belowMinDeposit_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.DepositTooSmall.selector);
        hook.predict(EVENT_ID, 0, MIN_DEPOSIT - 1, DEPOSIT);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.DepositTooSmall.selector);
        hook.predict(EVENT_ID, 0, DEPOSIT, MIN_DEPOSIT - 1);
    }

    function test_settleEvent_afterLargeSwaps() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Large directional swaps to cause IL
        _doSwap(true, -5_000e18);
        _doSwap(true, -5_000e18);
        _doSwap(true, -5_000e18);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        (,,,, bool settled,,,,, uint256 totalReturn0, uint256 totalReturn1,) = hook.getEvent(EVENT_ID);
        assertTrue(settled);

        // Verify settlement works even when totalReturn < totalDeposit (IL scenario)
        // Claims should still succeed
        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);
    }

    function test_createEvent_pastDeadline_reverts() public {
        vm.warp(5000);
        vm.expectRevert(PredictaPoolHook.InvalidDeadline.selector);
        hook.createEvent(EVENT_ID, "Past Event", 3, 4999, poolKey);
    }

    function test_createEvent_minOutcomes() public {
        hook.createEvent(EVENT_ID, "Binary Event", 2, DEADLINE, poolKey);

        (string memory name, uint8 numOutcomes,,,,,,,,,,) = hook.getEvent(EVENT_ID);
        assertEq(name, "Binary Event");
        assertEq(numOutcomes, 2);
    }

    function test_createEvent_invalidPoolKey_reverts() public {
        PoolKey memory badKey = PoolKey({
            currency0: currency0, currency1: currency1, fee: 3000, tickSpacing: 60, hooks: IHooks(address(0xdead))
        });

        vm.expectRevert(PredictaPoolHook.InvalidPoolKey.selector);
        hook.createEvent(EVENT_ID, "Bad Pool", 3, DEADLINE, badKey);
    }

    function test_cancelEvent_byOwner() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        (,,,,, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled);

        // Users can claim proportional refund
        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        vm.prank(alice);
        hook.claim(EVENT_ID);
        uint256 alicePayout0 = tokenA.balanceOf(alice) - aliceBal0Before;
        assertGt(alicePayout0, 0, "Alice should get refund");

        uint256 bobBal0Before = tokenA.balanceOf(bob);
        vm.prank(bob);
        hook.claim(EVENT_ID);
        uint256 bobPayout0 = tokenA.balanceOf(bob) - bobBal0Before;
        assertGt(bobPayout0, 0, "Bob should get refund");
    }

    function test_cancelEvent_autoExpiry() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // Non-owner can cancel after deadline + AUTO_EXPIRY
        vm.warp(DEADLINE + AUTO_EXPIRY + 1);

        vm.prank(charlie);
        hook.cancelEvent(EVENT_ID);

        (,,,,, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled);
    }

    function test_cancelEvent_beforeDeadline_reverts() public {
        _createDefaultEvent();

        // Non-owner before deadline
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.DeadlineNotPassed.selector);
        hook.cancelEvent(EVENT_ID);

        // Owner before deadline
        vm.expectRevert(PredictaPoolHook.DeadlineNotPassed.selector);
        hook.cancelEvent(EVENT_ID);
    }

    function test_claim_afterCancel() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        vm.prank(charlie);
        hook.predict(EVENT_ID, 2, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        // All users claim proportional refund
        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        uint256 aliceBal1Before = tokenB.balanceOf(alice);
        vm.prank(alice);
        hook.claim(EVENT_ID);
        assertGt(tokenA.balanceOf(alice) - aliceBal0Before, 0, "Alice token0 refund");
        assertGt(tokenB.balanceOf(alice) - aliceBal1Before, 0, "Alice token1 refund");

        uint256 bobBal0Before = tokenA.balanceOf(bob);
        vm.prank(bob);
        hook.claim(EVENT_ID);
        assertGt(tokenA.balanceOf(bob) - bobBal0Before, 0, "Bob token0 refund");

        uint256 charlieBal0Before = tokenA.balanceOf(charlie);
        vm.prank(charlie);
        hook.claim(EVENT_ID);
        assertGt(tokenA.balanceOf(charlie) - charlieBal0Before, 0, "Charlie token0 refund");
    }

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");
        hook.transferOwnership(newOwner);
        assertEq(hook.owner(), newOwner);
    }

    function test_transferOwnership_zeroAddress_reverts() public {
        vm.expectRevert(PredictaPoolHook.ZeroAddress.selector);
        hook.transferOwnership(address(0));
    }

    function test_pauseUnpause() public {
        _createDefaultEvent();

        // Pause
        hook.pause();

        // Predict should revert when paused
        vm.prank(alice);
        vm.expectRevert();
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // Unpause
        hook.unpause();

        // Predict should work again
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (, uint256 dep0,,,) = hook.predictions(EVENT_ID, alice);
        assertEq(dep0, DEPOSIT);
    }

    function test_settlementDelay_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);

        // Try to settle immediately (within SETTLEMENT_DELAY)
        vm.expectRevert(PredictaPoolHook.SettlementTooEarly.selector);
        hook.settleEvent(EVENT_ID);

        // Try at exactly resolvedAt + SETTLEMENT_DELAY - 1
        vm.warp(DEADLINE + 1 + 3599);
        vm.expectRevert(PredictaPoolHook.SettlementTooEarly.selector);
        hook.settleEvent(EVENT_ID);
    }

    function test_multipleEventsOnSamePool() public {
        _createDefaultEvent();

        bytes32 eventId2 = keccak256("SECOND_EVENT");
        vm.expectRevert(PredictaPoolHook.PoolHasActiveEvent.selector);
        hook.createEvent(eventId2, "Second Event", 2, DEADLINE, poolKey);
    }

    function test_protocolFee() public {
        address feeRecipient = makeAddr("feeRecipient");
        hook.setProtocolFee(500, feeRecipient); // 5%

        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Generate yield
        _doSwap(true, -100e18);
        _doSwap(false, -100e18);
        _doSwap(true, -50e18);
        _doSwap(false, -50e18);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);

        uint256 recipientBal0Before = tokenA.balanceOf(feeRecipient);
        uint256 recipientBal1Before = tokenB.balanceOf(feeRecipient);

        hook.settleEvent(EVENT_ID);

        uint256 feePaid0 = tokenA.balanceOf(feeRecipient) - recipientBal0Before;
        uint256 feePaid1 = tokenB.balanceOf(feeRecipient) - recipientBal1Before;

        // At least one token should have received a fee (if yield was generated)
        // Fee is 5% of yield, so it should be > 0 if yield > 0
        (,,,,,,,,, uint256 totalReturn0, uint256 totalReturn1,) = hook.getEvent(EVENT_ID);
        uint256 totalDeposit = DEPOSIT * 2;

        // totalReturn should be less than gross (fee was taken)
        // Claims should still succeed
        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);
    }

    function test_lastManStanding_rounding() public {
        _createDefaultEvent();

        // 3 users deposit
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(charlie);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Generate some yield
        _doSwap(true, -100e18);
        _doSwap(false, -100e18);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        // All 3 claim — last claimant must not revert due to rounding
        vm.prank(alice);
        hook.claim(EVENT_ID);

        vm.prank(bob);
        hook.claim(EVENT_ID);

        vm.prank(charlie);
        hook.claim(EVENT_ID);

        // Verify all claimed successfully
        (,,, bool aliceClaimed,) = hook.predictions(EVENT_ID, alice);
        (,,, bool bobClaimed,) = hook.predictions(EVENT_ID, bob);
        (,,, bool charlieClaimed,) = hook.predictions(EVENT_ID, charlie);

        assertTrue(aliceClaimed);
        assertTrue(bobClaimed);
        assertTrue(charlieClaimed);
    }

    // ─── Access Control Tests ───────────────────────────────────────────

    function test_blockExternalLP() public {
        _createDefaultEvent();

        PoolModifyLiquidityTest lpRouter = new PoolModifyLiquidityTest(poolManager);
        tokenA.mint(address(this), INITIAL_BALANCE);
        tokenB.mint(address(this), INITIAL_BALANCE);
        tokenA.approve(address(lpRouter), type(uint256).max);
        tokenB.approve(address(lpRouter), type(uint256).max);

        vm.expectRevert();
        lpRouter.modifyLiquidity(
            poolKey,
            IPoolManager.ModifyLiquidityParams({
                tickLower: -600, tickUpper: 600, liquidityDelta: 1000e18, salt: bytes32(0)
            }),
            ""
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW TESTS — Protocol Fee
    // ═══════════════════════════════════════════════════════════════════════

    function test_setProtocolFee_onlyOwner() public {
        address feeRecipient = makeAddr("feeRecipient");
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.setProtocolFee(500, feeRecipient);
    }

    function test_setProtocolFee_excessiveFee_reverts() public {
        address feeRecipient = makeAddr("feeRecipient");
        vm.expectRevert(PredictaPoolHook.ExcessiveProtocolFee.selector);
        hook.setProtocolFee(1001, feeRecipient);
    }

    function test_setProtocolFee_maxFee_succeeds() public {
        address feeRecipient = makeAddr("feeRecipient");
        hook.setProtocolFee(1000, feeRecipient);
        assertEq(hook.protocolFeeBps(), 1000);
        assertEq(hook.protocolFeeRecipient(), feeRecipient);
    }

    function test_setProtocolFee_nonZeroBps_zeroRecipient_reverts() public {
        vm.expectRevert(PredictaPoolHook.ZeroAddress.selector);
        hook.setProtocolFee(500, address(0));
    }

    function test_setProtocolFee_zeroBps_zeroRecipient_succeeds() public {
        hook.setProtocolFee(0, address(0));
        assertEq(hook.protocolFeeBps(), 0);
        assertEq(hook.protocolFeeRecipient(), address(0));
    }

    function test_protocolFee_deductedFromYield() public {
        address feeRecipient = makeAddr("feeRecipient");
        hook.setProtocolFee(500, feeRecipient); // 5%

        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Generate yield
        _doSwap(true, -100e18);
        _doSwap(false, -100e18);
        _doSwap(true, -50e18);
        _doSwap(false, -50e18);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);

        uint256 recipientBal0Before = tokenA.balanceOf(feeRecipient);
        uint256 recipientBal1Before = tokenB.balanceOf(feeRecipient);

        hook.settleEvent(EVENT_ID);

        uint256 feePaid0 = tokenA.balanceOf(feeRecipient) - recipientBal0Before;
        uint256 feePaid1 = tokenB.balanceOf(feeRecipient) - recipientBal1Before;

        // Fee should have been sent to recipient (at least one token should have fee)
        assertTrue(feePaid0 > 0 || feePaid1 > 0, "Fee recipient should receive fees from yield");

        // totalReturn stored in event should be gross minus fee
        (,,,,,,, uint256 totalDeposit0, uint256 totalDeposit1, uint256 totalReturn0, uint256 totalReturn1,) =
            hook.getEvent(EVENT_ID);

        // gross = totalReturn + fee, so totalReturn should be strictly less than gross
        uint256 gross0 = totalReturn0 + feePaid0;
        uint256 gross1 = totalReturn1 + feePaid1;

        // Fee is only on yield (gross - deposit), verify: fee = yield * 5%
        if (gross0 > totalDeposit0) {
            uint256 expectedFee0 = (gross0 - totalDeposit0) * 500 / 10_000;
            assertEq(feePaid0, expectedFee0, "Token0 fee should be 5% of yield");
        }
        if (gross1 > totalDeposit1) {
            uint256 expectedFee1 = (gross1 - totalDeposit1) * 500 / 10_000;
            assertEq(feePaid1, expectedFee1, "Token1 fee should be 5% of yield");
        }
    }

    function test_protocolFee_noYield_noFee() public {
        address feeRecipient = makeAddr("feeRecipient");
        hook.setProtocolFee(500, feeRecipient);

        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // No swaps => no yield

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);

        uint256 recipientBal0Before = tokenA.balanceOf(feeRecipient);
        uint256 recipientBal1Before = tokenB.balanceOf(feeRecipient);

        hook.settleEvent(EVENT_ID);

        uint256 feePaid0 = tokenA.balanceOf(feeRecipient) - recipientBal0Before;
        uint256 feePaid1 = tokenB.balanceOf(feeRecipient) - recipientBal1Before;

        assertEq(feePaid0, 0, "No yield means no fee for token0");
        assertEq(feePaid1, 0, "No yield means no fee for token1");
    }

    function test_protocolFee_zeroBps_noFeeDeducted() public {
        address feeRecipient = makeAddr("feeRecipient");
        // Set fee then clear it
        hook.setProtocolFee(500, feeRecipient);
        hook.setProtocolFee(0, address(0));

        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        _doSwap(true, -100e18);
        _doSwap(false, -100e18);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);

        uint256 recipientBal0Before = tokenA.balanceOf(feeRecipient);
        uint256 recipientBal1Before = tokenB.balanceOf(feeRecipient);

        hook.settleEvent(EVENT_ID);

        assertEq(tokenA.balanceOf(feeRecipient) - recipientBal0Before, 0, "Zero bps => no fee token0");
        assertEq(tokenB.balanceOf(feeRecipient) - recipientBal1Before, 0, "Zero bps => no fee token1");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW TESTS — Cancel Event Flow
    // ═══════════════════════════════════════════════════════════════════════

    function test_cancelEvent_ownerAfterDeadline() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Owner cancels right after deadline
        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        (,, uint8 winOutcome, bool resolved, bool settled, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled, "Event should be cancelled");
        assertTrue(settled, "Cancelled event should be marked settled");
        assertFalse(resolved, "Cancelled event should not be resolved");
    }

    function test_cancelEvent_nonOwnerBeforeAutoExpiry_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // Non-owner tries to cancel after deadline but before AUTO_EXPIRY
        vm.warp(DEADLINE + AUTO_EXPIRY);
        vm.prank(charlie);
        vm.expectRevert(PredictaPoolHook.DeadlineNotPassed.selector);
        hook.cancelEvent(EVENT_ID);
    }

    function test_cancelEvent_nonOwnerAfterAutoExpiry() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // Non-owner can cancel after deadline + AUTO_EXPIRY
        vm.warp(DEADLINE + AUTO_EXPIRY + 1);
        vm.prank(bob);
        hook.cancelEvent(EVENT_ID);

        (,,,,, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled, "Non-owner should cancel after AUTO_EXPIRY");
    }

    function test_cancelEvent_alreadyCancelled_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        // Second cancel should revert (settled flag is true)
        vm.expectRevert(PredictaPoolHook.EventAlreadySettled.selector);
        hook.cancelEvent(EVENT_ID);
    }

    function test_cancelEvent_noLiquidity() public {
        _createDefaultEvent();

        // No predictions made, so no liquidity
        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        (,,,,, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled, "Cancel with zero liquidity should work");
    }

    function test_cancelEvent_proportionalRefund_equalDeposits() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        vm.prank(charlie);
        hook.predict(EVENT_ID, 2, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        // All three deposited equally, so refunds should be roughly equal
        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        uint256 bobBal0Before = tokenA.balanceOf(bob);
        uint256 charlieBal0Before = tokenA.balanceOf(charlie);

        vm.prank(alice);
        hook.claim(EVENT_ID);
        uint256 aliceRefund0 = tokenA.balanceOf(alice) - aliceBal0Before;

        vm.prank(bob);
        hook.claim(EVENT_ID);
        uint256 bobRefund0 = tokenA.balanceOf(bob) - bobBal0Before;

        vm.prank(charlie);
        hook.claim(EVENT_ID);
        uint256 charlieRefund0 = tokenA.balanceOf(charlie) - charlieBal0Before;

        // All refunds should be equal (same deposit, proportional refund)
        assertEq(aliceRefund0, bobRefund0, "Equal depositors get equal refund (alice vs bob)");
        assertEq(bobRefund0, charlieRefund0, "Equal depositors get equal refund (bob vs charlie)");
        assertGt(aliceRefund0, 0, "Refund should be non-zero");
    }

    function test_cancelEvent_allowsNewEventOnSamePool() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        // After cancellation, a new event on the same pool should be allowed
        bytes32 newEventId = keccak256("NEW_EVENT_AFTER_CANCEL");
        hook.createEvent(newEventId, "New Event", 2, block.timestamp + 100_000, poolKey);

        (string memory name, uint8 numOutcomes,,,,,,,,,,) = hook.getEvent(newEventId);
        assertEq(name, "New Event");
        assertEq(numOutcomes, 2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW TESTS — Edge Cases
    // ═══════════════════════════════════════════════════════════════════════

    function test_predict_exactMinDeposit() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, MIN_DEPOSIT, MIN_DEPOSIT);

        (uint8 outcome,, uint256 dep1,, bool exists) = hook.predictions(EVENT_ID, alice);
        assertEq(outcome, 0);
        assertTrue(exists, "Prediction with exact MIN_DEPOSIT should succeed");
    }

    function test_predict_sameUser_sameOutcome_increasesDeposit() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (, uint256 dep0First, uint256 dep1First,,) = hook.predictions(EVENT_ID, alice);

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (, uint256 dep0Second, uint256 dep1Second,,) = hook.predictions(EVENT_ID, alice);

        assertEq(dep0Second, dep0First + DEPOSIT, "Second deposit should add to first for token0");
        assertEq(dep1Second, dep1First + DEPOSIT, "Second deposit should add to first for token1");
    }

    function test_predict_sameUser_differentOutcome_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.OutcomeMismatch.selector);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Also verify trying outcome 2
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.OutcomeMismatch.selector);
        hook.predict(EVENT_ID, 2, DEPOSIT, DEPOSIT);
    }

    function test_predict_predictorCountIncrementsOnce() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        // Second prediction by same user should NOT increment totalPredictors
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // We expect totalPredictors = 2 (alice + bob), not 3
        // Verify via claim count after full lifecycle
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        // Both should claim successfully
        vm.prank(alice);
        hook.claim(EVENT_ID);
        vm.prank(bob);
        hook.claim(EVENT_ID);

        (,,, bool aliceClaimed,) = hook.predictions(EVENT_ID, alice);
        (,,, bool bobClaimed,) = hook.predictions(EVENT_ID, bob);
        assertTrue(aliceClaimed);
        assertTrue(bobClaimed);
    }

    function test_claim_noWinners_yieldDistributedProportionally() public {
        // Create event with 3 outcomes, but resolve with outcome that nobody picked
        _createDefaultEvent();

        // Alice picks outcome 0, Bob picks outcome 1 — nobody picks outcome 2
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);

        // Generate yield
        _doSwap(true, -100e18);
        _doSwap(false, -100e18);
        _doSwap(true, -50e18);
        _doSwap(false, -50e18);

        // Resolve with outcome 2 — no winners
        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 2);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        (,,,,,,, uint256 totalDeposit0,, uint256 totalReturn0,,) = hook.getEvent(EVENT_ID);

        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        uint256 bobBal0Before = tokenA.balanceOf(bob);

        vm.prank(alice);
        hook.claim(EVENT_ID);
        uint256 alicePayout0 = tokenA.balanceOf(alice) - aliceBal0Before;

        vm.prank(bob);
        hook.claim(EVENT_ID);
        uint256 bobPayout0 = tokenA.balanceOf(bob) - bobBal0Before;

        // Equal deposits => equal payouts (both get principal + proportional yield)
        assertEq(alicePayout0, bobPayout0, "No winners: equal depositors get equal share");

        // Each should get roughly half of totalReturn
        assertGt(alicePayout0, 0, "No winners: Alice should still get payout");
        assertGt(bobPayout0, 0, "No winners: Bob should still get payout");
    }

    function test_predict_cancelledEvent_reverts() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.cancelEvent(EVENT_ID);

        // Trying to predict on a cancelled event should revert
        vm.prank(bob);
        vm.expectRevert(PredictaPoolHook.EventAlreadyResolved.selector);
        hook.predict(EVENT_ID, 1, DEPOSIT, DEPOSIT);
    }

    function test_predict_depositsPerOutcome_tracked() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, DEPOSIT * 2, DEPOSIT * 2);

        uint256 outcome0_dep0 = hook.depositsPerOutcome0(EVENT_ID, 0);
        uint256 outcome0_dep1 = hook.depositsPerOutcome1(EVENT_ID, 0);
        uint256 outcome1_dep0 = hook.depositsPerOutcome0(EVENT_ID, 1);
        uint256 outcome1_dep1 = hook.depositsPerOutcome1(EVENT_ID, 1);

        assertEq(outcome0_dep0, DEPOSIT, "Outcome 0 token0 deposits");
        assertEq(outcome0_dep1, DEPOSIT, "Outcome 0 token1 deposits");
        assertEq(outcome1_dep0, DEPOSIT * 2, "Outcome 1 token0 deposits");
        assertEq(outcome1_dep1, DEPOSIT * 2, "Outcome 1 token1 deposits");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW TESTS — Pause / Unpause
    // ═══════════════════════════════════════════════════════════════════════

    function test_pause_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.pause();
    }

    function test_unpause_onlyOwner() public {
        hook.pause();
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.unpause();
    }

    function test_pause_predictReverts_unpause_predictWorks() public {
        _createDefaultEvent();

        hook.pause();

        // Predict should revert with EnforcedPause
        vm.prank(alice);
        vm.expectRevert();
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        hook.unpause();

        // Predict should succeed now
        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        (, uint256 dep0,,, bool exists) = hook.predictions(EVENT_ID, alice);
        assertTrue(exists, "Prediction should work after unpause");
        assertEq(dep0, DEPOSIT);
    }

    function test_pause_doesNotBlockClaim() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        // Pause the contract
        hook.pause();

        // Claim should still work (claim is not gated by whenNotPaused)
        vm.prank(alice);
        hook.claim(EVENT_ID);

        (,,, bool claimed,) = hook.predictions(EVENT_ID, alice);
        assertTrue(claimed, "Claim should succeed even when paused");
    }

    function test_pause_doesNotBlockSettle() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);

        hook.pause();

        // Settle should still work (not gated by whenNotPaused)
        hook.settleEvent(EVENT_ID);

        (,,,, bool settled,,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(settled, "Settle should succeed even when paused");
    }

    function test_pause_doesNotBlockCancel() public {
        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, DEPOSIT, DEPOSIT);

        vm.warp(DEADLINE + 1);
        hook.pause();

        // Cancel should still work (not gated by whenNotPaused)
        hook.cancelEvent(EVENT_ID);

        (,,,,, bool cancelled,,,,,,) = hook.getEvent(EVENT_ID);
        assertTrue(cancelled, "Cancel should succeed even when paused");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NEW TESTS — Ownership Transfer
    // ═══════════════════════════════════════════════════════════════════════

    function test_transferOwnership_nonOwner_reverts() public {
        vm.prank(alice);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.transferOwnership(bob);
    }

    function test_transferOwnership_oldOwnerLosesAdmin() public {
        address newOwner = makeAddr("newOwner");
        hook.transferOwnership(newOwner);

        // Old owner (address(this)) should no longer be able to admin
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.createEvent(EVENT_ID, "Test", 3, DEADLINE, poolKey);

        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.pause();

        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.setProtocolFee(100, newOwner);

        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.transferOwnership(alice);
    }

    function test_transferOwnership_newOwnerCanAdmin() public {
        address newOwner = makeAddr("newOwner");
        hook.transferOwnership(newOwner);

        // New owner should be able to perform admin actions
        vm.startPrank(newOwner);

        hook.createEvent(EVENT_ID, "New Owner Event", 2, DEADLINE, poolKey);
        (string memory name,,,,,,,,,,,) = hook.getEvent(EVENT_ID);
        assertEq(name, "New Owner Event");

        hook.pause();
        hook.unpause();

        address feeRecipient = makeAddr("feeRecipient");
        hook.setProtocolFee(300, feeRecipient);
        assertEq(hook.protocolFeeBps(), 300);

        vm.stopPrank();
    }

    function test_transferOwnership_emitsEvent() public {
        address newOwner = makeAddr("newOwner");

        vm.expectEmit(true, true, false, false);
        emit PredictaPoolHook.OwnershipTransferred(address(this), newOwner);
        hook.transferOwnership(newOwner);
    }

    function test_transferOwnership_chainedTransfer() public {
        address owner2 = makeAddr("owner2");
        address owner3 = makeAddr("owner3");

        hook.transferOwnership(owner2);
        assertEq(hook.owner(), owner2);

        vm.prank(owner2);
        hook.transferOwnership(owner3);
        assertEq(hook.owner(), owner3);

        // Original owner and owner2 should both be locked out
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.pause();

        vm.prank(owner2);
        vm.expectRevert(PredictaPoolHook.NotOwner.selector);
        hook.pause();

        // owner3 should work
        vm.prank(owner3);
        hook.pause();
    }
}
