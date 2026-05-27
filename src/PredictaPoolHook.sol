// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {LiquidityAmounts} from "@uniswap/v4-periphery/src/libraries/LiquidityAmounts.sol";
import {IERC20} from "@uniswap/v4-core/lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@uniswap/v4-core/lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@uniswap/v4-core/lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@uniswap/v4-core/lib/openzeppelin-contracts/contracts/utils/Pausable.sol";

contract PredictaPoolHook is IHooks, IUnlockCallback, ReentrancyGuard, Pausable {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using SafeERC20 for IERC20;

    // ─── Errors ─────────────────────────────────────────────────────────

    error AlreadyClaimed();
    error DeadlineNotPassed();
    error DeadlinePassed();
    error DepositTooSmall();
    error EventAlreadyExists();
    error EventAlreadyResolved();
    error EventAlreadySettled();
    error EventNotFound();
    error EventNotResolved();
    error EventNotSettled();
    error ExcessiveProtocolFee();
    error InvalidDeadline();
    error InvalidOutcome();
    error InvalidPoolKey();
    error NoPrediction();
    error NotOwner();
    error NotPoolManager();
    error OnlyHookCanModifyLiquidity();
    error OutcomeMismatch();
    error PoolHasActiveEvent();
    error SettlementTooEarly();
    error ZeroAddress();
    error ZeroAmount();

    // ─── Events ─────────────────────────────────────────────────────────

    event Claimed(bytes32 indexed eventId, address indexed user, uint256 payout0, uint256 payout1, bool isWinner);
    event DepositRefunded(bytes32 indexed eventId, address indexed user, uint256 refund0, uint256 refund1);
    event EventCancelled(bytes32 indexed eventId);
    event EventCreated(bytes32 indexed eventId, string name, uint8 numOutcomes, uint256 deadline);
    event EventResolved(bytes32 indexed eventId, uint8 winningOutcome);
    event EventSettled(bytes32 indexed eventId, uint256 totalReturn0, uint256 totalReturn1);
    event OwnershipTransferred(address indexed prev, address indexed next);
    event PredictionMade(
        bytes32 indexed eventId, address indexed user, uint8 outcome, uint256 amount0, uint256 amount1
    );
    event ProtocolFeeUpdated(uint256 bps, address recipient);

    // ─── Constants ──────────────────────────────────────────────────────

    uint8 internal constant ACTION_ADD_LIQUIDITY = 1;
    uint8 internal constant ACTION_REMOVE_LIQUIDITY = 2;
    uint256 public constant AUTO_EXPIRY = 30 days;
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 1000;
    uint256 public constant MIN_DEPOSIT = 1e15;
    uint256 public constant SETTLEMENT_DELAY = 3600;

    // ─── State Variables ────────────────────────────────────────────────

    IPoolManager public immutable poolManager;
    address public owner;
    uint256 public protocolFeeBps;
    address public protocolFeeRecipient;

    // ─── Structs ────────────────────────────────────────────────────────

    struct PredictionEvent {
        string name;
        PoolKey poolKey;
        uint8 numOutcomes;
        uint8 winningOutcome;
        bool exists;
        bool resolved;
        bool settled;
        bool cancelled;
        uint256 deadline;
        uint256 resolvedAt;
        uint256 totalDeposit0;
        uint256 totalDeposit1;
        uint128 totalLiquidity;
        uint256 totalReturn0;
        uint256 totalReturn1;
        uint256 swapCount;
        int24 tickLower;
        int24 tickUpper;
        uint256 totalClaimed0;
        uint256 totalClaimed1;
        uint256 claimCount;
        uint256 totalPredictors;
    }

    struct UserPrediction {
        uint8 outcome;
        uint256 deposit0;
        uint256 deposit1;
        bool claimed;
        bool exists;
    }

    // ─── Mappings ───────────────────────────────────────────────────────

    mapping(bytes32 => PredictionEvent) internal _events;
    mapping(bytes32 => mapping(address => UserPrediction)) public predictions;
    mapping(bytes32 => mapping(uint8 => uint256)) public depositsPerOutcome0;
    mapping(bytes32 => mapping(uint8 => uint256)) public depositsPerOutcome1;
    mapping(PoolId => bytes32) public poolEventIds;

    // ─── Constructor ────────────────────────────────────────────────────

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        owner = msg.sender;
        Hooks.validateHookPermissions(IHooks(address(this)), _hookPermissions());
    }

    // ─── Modifiers ──────────────────────────────────────────────────────

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ─── Admin ──────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    function setProtocolFee(uint256 bps, address recipient) external onlyOwner {
        if (bps > MAX_PROTOCOL_FEE_BPS) revert ExcessiveProtocolFee();
        if (bps > 0 && recipient == address(0)) revert ZeroAddress();
        protocolFeeBps = bps;
        protocolFeeRecipient = recipient;
        emit ProtocolFeeUpdated(bps, recipient);
    }

    // ─── Event Management ───────────────────────────────────────────────

    function createEvent(
        bytes32 eventId,
        string calldata name,
        uint8 numOutcomes,
        uint256 deadline,
        PoolKey calldata poolKey
    ) external onlyOwner {
        if (_events[eventId].exists) revert EventAlreadyExists();
        if (numOutcomes < 2) revert InvalidOutcome();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (address(poolKey.hooks) != address(this)) revert InvalidPoolKey();

        PoolId pid = poolKey.toId();
        bytes32 existingId = poolEventIds[pid];
        if (existingId != bytes32(0)) {
            PredictionEvent storage existing = _events[existingId];
            if (existing.exists && !existing.settled && !existing.cancelled) {
                revert PoolHasActiveEvent();
            }
        }

        int24 spacing = poolKey.tickSpacing;
        int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
        int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

        _events[eventId] = PredictionEvent({
            name: name,
            poolKey: poolKey,
            numOutcomes: numOutcomes,
            winningOutcome: 0,
            exists: true,
            resolved: false,
            settled: false,
            cancelled: false,
            deadline: deadline,
            resolvedAt: 0,
            totalDeposit0: 0,
            totalDeposit1: 0,
            totalLiquidity: 0,
            totalReturn0: 0,
            totalReturn1: 0,
            swapCount: 0,
            tickLower: tickLower,
            tickUpper: tickUpper,
            totalClaimed0: 0,
            totalClaimed1: 0,
            claimCount: 0,
            totalPredictors: 0
        });

        poolEventIds[pid] = eventId;
        emit EventCreated(eventId, name, numOutcomes, deadline);
    }

    function resolveEvent(bytes32 eventId, uint8 winningOutcome) external onlyOwner {
        PredictionEvent storage evt = _events[eventId];
        if (!evt.exists) revert EventNotFound();
        if (evt.resolved) revert EventAlreadyResolved();
        if (evt.cancelled) revert EventNotFound();
        if (block.timestamp <= evt.deadline) revert DeadlineNotPassed();
        if (winningOutcome >= evt.numOutcomes) revert InvalidOutcome();

        evt.resolved = true;
        evt.winningOutcome = winningOutcome;
        evt.resolvedAt = block.timestamp;
        emit EventResolved(eventId, winningOutcome);
    }

    function cancelEvent(bytes32 eventId) external nonReentrant {
        PredictionEvent storage evt = _events[eventId];
        if (!evt.exists) revert EventNotFound();
        if (evt.settled || evt.cancelled) revert EventAlreadySettled();
        if (evt.resolved) revert EventAlreadyResolved();

        bool isOwner = msg.sender == owner;
        if (isOwner) {
            if (block.timestamp <= evt.deadline) revert DeadlineNotPassed();
        } else {
            if (block.timestamp <= evt.deadline + AUTO_EXPIRY) revert DeadlineNotPassed();
        }

        if (evt.totalLiquidity > 0) {
            uint256 bal0Before = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
            uint256 bal1Before = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

            poolManager.unlock(abi.encode(ACTION_REMOVE_LIQUIDITY, eventId, uint256(0), uint256(0)));

            uint256 bal0After = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
            uint256 bal1After = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

            evt.totalReturn0 = bal0After - bal0Before;
            evt.totalReturn1 = bal1After - bal1Before;
        }

        evt.cancelled = true;
        evt.settled = true;
        emit EventCancelled(eventId);
    }

    // ─── User Functions ─────────────────────────────────────────────────

    function predict(bytes32 eventId, uint8 outcome, uint256 amount0, uint256 amount1)
        external
        nonReentrant
        whenNotPaused
    {
        PredictionEvent storage evt = _events[eventId];
        if (!evt.exists) revert EventNotFound();
        if (evt.resolved || evt.cancelled) revert EventAlreadyResolved();
        if (block.timestamp > evt.deadline) revert DeadlinePassed();
        if (outcome >= evt.numOutcomes) revert InvalidOutcome();
        if (amount0 == 0 && amount1 == 0) revert ZeroAmount();
        if (amount0 < MIN_DEPOSIT || amount1 < MIN_DEPOSIT) revert DepositTooSmall();

        UserPrediction storage pred = predictions[eventId][msg.sender];
        if (pred.exists && pred.outcome != outcome) revert OutcomeMismatch();

        address token0 = Currency.unwrap(evt.poolKey.currency0);
        address token1 = Currency.unwrap(evt.poolKey.currency1);

        uint256 bal0Before = IERC20(token0).balanceOf(address(this));
        uint256 bal1Before = IERC20(token1).balanceOf(address(this));

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        uint256 actual0 = IERC20(token0).balanceOf(address(this)) - bal0Before;
        uint256 actual1 = IERC20(token1).balanceOf(address(this)) - bal1Before;

        bytes memory result = poolManager.unlock(abi.encode(ACTION_ADD_LIQUIDITY, eventId, actual0, actual1));
        (uint128 liquidityAdded, uint256 used0, uint256 used1) = abi.decode(result, (uint128, uint256, uint256));

        uint256 refund0 = actual0 - used0;
        uint256 refund1 = actual1 - used1;
        if (refund0 > 0) {
            IERC20(token0).safeTransfer(msg.sender, refund0);
        }
        if (refund1 > 0) {
            IERC20(token1).safeTransfer(msg.sender, refund1);
        }

        evt.totalDeposit0 += used0;
        evt.totalDeposit1 += used1;
        evt.totalLiquidity += liquidityAdded;

        if (pred.exists) {
            pred.deposit0 += used0;
            pred.deposit1 += used1;
        } else {
            predictions[eventId][msg.sender] =
                UserPrediction({outcome: outcome, deposit0: used0, deposit1: used1, claimed: false, exists: true});
            evt.totalPredictors++;
        }

        depositsPerOutcome0[eventId][outcome] += used0;
        depositsPerOutcome1[eventId][outcome] += used1;

        emit PredictionMade(eventId, msg.sender, outcome, used0, used1);
        if (refund0 > 0 || refund1 > 0) {
            emit DepositRefunded(eventId, msg.sender, refund0, refund1);
        }
    }

    function claim(bytes32 eventId) external nonReentrant {
        PredictionEvent storage evt = _events[eventId];
        if (!evt.exists) revert EventNotFound();
        if (!evt.settled) revert EventNotSettled();

        UserPrediction storage pred = predictions[eventId][msg.sender];
        if (!pred.exists) revert NoPrediction();
        if (pred.claimed) revert AlreadyClaimed();
        pred.claimed = true;

        evt.claimCount++;

        uint256 payout0;
        uint256 payout1;
        bool isWinner;

        if (evt.cancelled) {
            (payout0, payout1) = _calculateCancelRefund(evt, pred);
        } else {
            isWinner = pred.outcome == evt.winningOutcome;
            (payout0, payout1) = _calculatePayout(eventId, evt, pred, isWinner);
        }

        if (evt.claimCount == evt.totalPredictors) {
            address token0 = Currency.unwrap(evt.poolKey.currency0);
            address token1 = Currency.unwrap(evt.poolKey.currency1);
            uint256 remaining0 = evt.totalReturn0 - evt.totalClaimed0;
            uint256 remaining1 = evt.totalReturn1 - evt.totalClaimed1;
            if (payout0 > remaining0) payout0 = remaining0;
            if (payout1 > remaining1) payout1 = remaining1;

            if (payout0 > 0) {
                IERC20(token0).safeTransfer(msg.sender, payout0);
            }
            if (payout1 > 0) {
                IERC20(token1).safeTransfer(msg.sender, payout1);
            }
        } else {
            if (payout0 > 0) {
                IERC20(Currency.unwrap(evt.poolKey.currency0)).safeTransfer(msg.sender, payout0);
            }
            if (payout1 > 0) {
                IERC20(Currency.unwrap(evt.poolKey.currency1)).safeTransfer(msg.sender, payout1);
            }
        }

        evt.totalClaimed0 += payout0;
        evt.totalClaimed1 += payout1;

        emit Claimed(eventId, msg.sender, payout0, payout1, isWinner);
    }

    // ─── Settlement ─────────────────────────────────────────────────────

    function settleEvent(bytes32 eventId) external nonReentrant {
        PredictionEvent storage evt = _events[eventId];
        if (!evt.exists) revert EventNotFound();
        if (!evt.resolved) revert EventNotResolved();
        if (evt.settled) revert EventAlreadySettled();
        if (block.timestamp < evt.resolvedAt + SETTLEMENT_DELAY) revert SettlementTooEarly();

        uint256 bal0Before = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
        uint256 bal1Before = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

        poolManager.unlock(abi.encode(ACTION_REMOVE_LIQUIDITY, eventId, uint256(0), uint256(0)));

        uint256 bal0After = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
        uint256 bal1After = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

        uint256 gross0 = bal0After - bal0Before;
        uint256 gross1 = bal1After - bal1Before;

        if (protocolFeeBps > 0 && protocolFeeRecipient != address(0)) {
            uint256 yield0 = gross0 > evt.totalDeposit0 ? gross0 - evt.totalDeposit0 : 0;
            uint256 yield1 = gross1 > evt.totalDeposit1 ? gross1 - evt.totalDeposit1 : 0;

            uint256 fee0 = yield0 * protocolFeeBps / 10_000;
            uint256 fee1 = yield1 * protocolFeeBps / 10_000;

            if (fee0 > 0) {
                IERC20(Currency.unwrap(evt.poolKey.currency0)).safeTransfer(protocolFeeRecipient, fee0);
            }
            if (fee1 > 0) {
                IERC20(Currency.unwrap(evt.poolKey.currency1)).safeTransfer(protocolFeeRecipient, fee1);
            }

            evt.totalReturn0 = gross0 - fee0;
            evt.totalReturn1 = gross1 - fee1;
        } else {
            evt.totalReturn0 = gross0;
            evt.totalReturn1 = gross1;
        }

        evt.settled = true;
        emit EventSettled(eventId, evt.totalReturn0, evt.totalReturn1);
    }

    // ─── Hook Callbacks (used) ──────────────────────────────────────────

    /// @notice Restricts liquidity additions to the Hook contract itself.
    /// @dev Prevents external LPs from adding liquidity directly, which would dilute prediction pools.
    function beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4) {
        if (sender != address(this)) revert OnlyHookCanModifyLiquidity();
        return IHooks.beforeAddLiquidity.selector;
    }

    /// @notice Restricts liquidity removal to the Hook contract itself.
    /// @dev Protects depositor funds from being withdrawn externally before event settlement.
    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4) {
        if (sender != address(this)) revert OnlyHookCanModifyLiquidity();
        return IHooks.beforeRemoveLiquidity.selector;
    }

    /// @notice Tracks swap activity per prediction event for yield analytics.
    /// @dev Increments the event's swapCount so settlement can report yield-generating activity.
    function afterSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        external
        onlyPoolManager
        returns (bytes4, int128)
    {
        bytes32 eventId = poolEventIds[key.toId()];
        if (eventId != bytes32(0)) {
            ++_events[eventId].swapCount;
        }
        return (IHooks.afterSwap.selector, 0);
    }

    // ─── Hook Callbacks (unused stubs - required by IHooks) ─────────────

    function beforeInitialize(address, PoolKey calldata, uint160) external view onlyPoolManager returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external view onlyPoolManager returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0));
    }

    function afterRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0));
    }

    // Stub required by IHooks — not active (beforeSwap permission is false)
    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        view
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        view
        onlyPoolManager
        returns (bytes4)
    {
        return IHooks.beforeDonate.selector;
    }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external
        view
        onlyPoolManager
        returns (bytes4)
    {
        return IHooks.afterDonate.selector;
    }

    // ─── UnlockCallback + Internal Helpers ──────────────────────────────

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();

        (uint8 action, bytes32 eventId, uint256 param0, uint256 param1) =
            abi.decode(data, (uint8, bytes32, uint256, uint256));

        if (action == ACTION_ADD_LIQUIDITY) {
            return _handleAddLiquidity(eventId, param0, param1);
        } else {
            return _handleRemoveLiquidity(eventId);
        }
    }

    function _handleAddLiquidity(bytes32 eventId, uint256 amount0, uint256 amount1) internal returns (bytes memory) {
        PredictionEvent storage evt = _events[eventId];
        PoolKey memory key = evt.poolKey;

        (uint160 sqrtPriceX96,,,) = poolManager.getSlot0(key.toId());

        uint160 sqrtPriceA = TickMath.getSqrtPriceAtTick(evt.tickLower);
        uint160 sqrtPriceB = TickMath.getSqrtPriceAtTick(evt.tickUpper);

        uint128 liquidity =
            LiquidityAmounts.getLiquidityForAmounts(sqrtPriceX96, sqrtPriceA, sqrtPriceB, amount0, amount1);

        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: evt.tickLower,
                tickUpper: evt.tickUpper,
                liquidityDelta: int256(uint256(liquidity)),
                salt: eventId
            }),
            ""
        );

        _settleDelta(key, delta);

        uint256 used0 = delta.amount0() < 0 ? uint256(uint128(-delta.amount0())) : 0;
        uint256 used1 = delta.amount1() < 0 ? uint256(uint128(-delta.amount1())) : 0;

        return abi.encode(liquidity, used0, used1);
    }

    function _handleRemoveLiquidity(bytes32 eventId) internal returns (bytes memory) {
        PredictionEvent storage evt = _events[eventId];
        PoolKey memory key = evt.poolKey;

        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: evt.tickLower,
                tickUpper: evt.tickUpper,
                liquidityDelta: -int256(uint256(evt.totalLiquidity)),
                salt: eventId
            }),
            ""
        );

        _takeDelta(key, delta);

        return "";
    }

    function _settleDelta(PoolKey memory key, BalanceDelta delta) internal {
        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();

        if (d0 < 0) {
            uint256 owed = uint256(uint128(-d0));
            poolManager.sync(key.currency0);
            IERC20(Currency.unwrap(key.currency0)).safeTransfer(address(poolManager), owed);
            poolManager.settle();
        }
        if (d1 < 0) {
            uint256 owed = uint256(uint128(-d1));
            poolManager.sync(key.currency1);
            IERC20(Currency.unwrap(key.currency1)).safeTransfer(address(poolManager), owed);
            poolManager.settle();
        }
    }

    function _takeDelta(PoolKey memory key, BalanceDelta delta) internal {
        int128 d0 = delta.amount0();
        int128 d1 = delta.amount1();

        if (d0 > 0) {
            poolManager.take(key.currency0, address(this), uint256(uint128(d0)));
        }
        if (d1 > 0) {
            poolManager.take(key.currency1, address(this), uint256(uint128(d1)));
        }
    }

    function _calculatePayout(bytes32 eventId, PredictionEvent storage evt, UserPrediction storage pred, bool isWinner)
        internal
        view
        returns (uint256 payout0, uint256 payout1)
    {
        uint256 totalDep0 = evt.totalDeposit0;
        uint256 totalDep1 = evt.totalDeposit1;
        uint256 totalRet0 = evt.totalReturn0;
        uint256 totalRet1 = evt.totalReturn1;

        uint256 effectivePrincipal0 = totalRet0 < totalDep0 ? totalRet0 : totalDep0;
        uint256 effectivePrincipal1 = totalRet1 < totalDep1 ? totalRet1 : totalDep1;
        uint256 yield0 = totalRet0 - effectivePrincipal0;
        uint256 yield1 = totalRet1 - effectivePrincipal1;

        payout0 = totalDep0 > 0 ? effectivePrincipal0 * pred.deposit0 / totalDep0 : 0;
        payout1 = totalDep1 > 0 ? effectivePrincipal1 * pred.deposit1 / totalDep1 : 0;

        uint8 winOutcome = evt.winningOutcome;
        uint256 winTotal0 = depositsPerOutcome0[eventId][winOutcome];
        uint256 winTotal1 = depositsPerOutcome1[eventId][winOutcome];
        bool noWinners = winTotal0 == 0 && winTotal1 == 0;

        if (noWinners) {
            if (totalDep0 > 0) {
                payout0 += yield0 * pred.deposit0 / totalDep0;
            }
            if (totalDep1 > 0) {
                payout1 += yield1 * pred.deposit1 / totalDep1;
            }
        } else if (isWinner) {
            if (winTotal0 > 0) {
                payout0 += yield0 * pred.deposit0 / winTotal0;
            }
            if (winTotal1 > 0) {
                payout1 += yield1 * pred.deposit1 / winTotal1;
            }
        }
    }

    function _calculateCancelRefund(PredictionEvent storage evt, UserPrediction storage pred)
        internal
        view
        returns (uint256 payout0, uint256 payout1)
    {
        uint256 totalDep0 = evt.totalDeposit0;
        uint256 totalDep1 = evt.totalDeposit1;

        payout0 = totalDep0 > 0 ? evt.totalReturn0 * pred.deposit0 / totalDep0 : 0;
        payout1 = totalDep1 > 0 ? evt.totalReturn1 * pred.deposit1 / totalDep1 : 0;
    }

    // ─── View Functions ─────────────────────────────────────────────────

    function getEvent(bytes32 eventId)
        external
        view
        returns (
            string memory name,
            uint8 numOutcomes,
            uint8 winningOutcome,
            bool resolved,
            bool settled,
            bool cancelled,
            uint256 deadline,
            uint256 totalDeposit0,
            uint256 totalDeposit1,
            uint256 totalReturn0,
            uint256 totalReturn1,
            uint256 swapCount
        )
    {
        PredictionEvent storage evt = _events[eventId];
        return (
            evt.name,
            evt.numOutcomes,
            evt.winningOutcome,
            evt.resolved,
            evt.settled,
            evt.cancelled,
            evt.deadline,
            evt.totalDeposit0,
            evt.totalDeposit1,
            evt.totalReturn0,
            evt.totalReturn1,
            evt.swapCount
        );
    }

    // ─── Hook Permissions ───────────────────────────────────────────────

    function _hookPermissions() internal pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }
}
