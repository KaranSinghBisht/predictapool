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

import {MockERC20} from "../src/tokens/MockERC20.sol";
import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";
import {HookMiner} from "./utils/HookDeployer.sol";

contract PredictaPoolHookFuzzTest is Test {
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

    bytes32 constant EVENT_ID = keccak256("FUZZ_EVENT");
    uint256 constant INITIAL_BALANCE = 100_000e18;
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint256 constant DEADLINE = 1_000_000;
    uint256 constant MIN_DEPOSIT = 1e15;

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
        uint160(
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
    }

    function _setupUser(address user) internal {
        tokenA.mint(user, INITIAL_BALANCE);
        tokenB.mint(user, INITIAL_BALANCE);
        vm.startPrank(user);
        tokenA.approve(address(hook), type(uint256).max);
        tokenB.approve(address(hook), type(uint256).max);
        vm.stopPrank();
    }

    function _createDefaultEvent() internal {
        hook.createEvent(EVENT_ID, "Fuzz Event", 3, DEADLINE, poolKey);
    }

    // ─── Fuzz Tests ─────────────────────────────────────────────────────

    function testFuzz_predict_amounts(uint256 amount0, uint256 amount1) public {
        amount0 = bound(amount0, MIN_DEPOSIT, 10_000e18);
        amount1 = bound(amount1, MIN_DEPOSIT, 10_000e18);

        _createDefaultEvent();

        uint256 bal0Before = tokenA.balanceOf(alice);
        uint256 bal1Before = tokenB.balanceOf(alice);

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, amount0, amount1);

        (uint8 outcome, uint256 dep0, uint256 dep1, bool claimed, bool exists) = hook.predictions(EVENT_ID, alice);

        assertEq(outcome, 0);
        assertLe(dep0, amount0);
        assertLe(dep1, amount1);
        assertTrue(dep0 > 0 || dep1 > 0);
        assertFalse(claimed);
        assertTrue(exists);

        assertEq(tokenA.balanceOf(alice), bal0Before - dep0);
        assertEq(tokenB.balanceOf(alice), bal1Before - dep1);

        (,,,,,,, uint256 totalDeposit0, uint256 totalDeposit1,,,) = hook.getEvent(EVENT_ID);
        assertEq(totalDeposit0, dep0);
        assertEq(totalDeposit1, dep1);
    }

    function testFuzz_calculatePayout_conservation(uint256 dep1, uint256 dep2) public {
        dep1 = bound(dep1, MIN_DEPOSIT, 10_000e18);
        dep2 = bound(dep2, MIN_DEPOSIT, 10_000e18);

        _createDefaultEvent();

        vm.prank(alice);
        hook.predict(EVENT_ID, 0, dep1, dep1);

        vm.prank(bob);
        hook.predict(EVENT_ID, 1, dep2, dep2);

        vm.warp(DEADLINE + 1);
        hook.resolveEvent(EVENT_ID, 0);
        vm.warp(block.timestamp + 3601);
        hook.settleEvent(EVENT_ID);

        (,,,,,,,,, uint256 totalReturn0, uint256 totalReturn1,) = hook.getEvent(EVENT_ID);

        uint256 aliceBal0Before = tokenA.balanceOf(alice);
        uint256 aliceBal1Before = tokenB.balanceOf(alice);

        vm.prank(alice);
        hook.claim(EVENT_ID);

        uint256 alicePayout0 = tokenA.balanceOf(alice) - aliceBal0Before;
        uint256 alicePayout1 = tokenB.balanceOf(alice) - aliceBal1Before;

        uint256 bobBal0Before = tokenA.balanceOf(bob);
        uint256 bobBal1Before = tokenB.balanceOf(bob);

        vm.prank(bob);
        hook.claim(EVENT_ID);

        uint256 bobPayout0 = tokenA.balanceOf(bob) - bobBal0Before;
        uint256 bobPayout1 = tokenB.balanceOf(bob) - bobBal1Before;

        // Total payouts must never exceed total returns (sum conservation)
        assertLe(alicePayout0 + bobPayout0, totalReturn0, "Token0 payouts exceed returns");
        assertLe(alicePayout1 + bobPayout1, totalReturn1, "Token1 payouts exceed returns");
    }
}
