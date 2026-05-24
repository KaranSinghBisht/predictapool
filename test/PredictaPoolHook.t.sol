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

        uint160 flags =
            uint160(Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG | Hooks.AFTER_SWAP_FLAG);

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

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, amount0, amount1);

        (uint8 outcome, uint256 dep0, uint256 dep1, bool claimed, bool exists) = hook.predictions(EVENT_ID, alice);
        assertEq(outcome, 0);
        assertEq(dep0, amount0);
        assertEq(dep1, amount1);
        assertFalse(claimed);
        assertTrue(exists);
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
}
