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

contract PredictaPoolHook is IHooks, IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;
    using SafeERC20 for IERC20;

    error NotPoolManager();
    error NotOwner();
    error EventNotFound();
    error EventAlreadyExists();
    error EventAlreadyResolved();
    error EventNotResolved();
    error EventAlreadySettled();
    error EventNotSettled();
    error DeadlinePassed();
    error DeadlineNotPassed();
    error InvalidOutcome();
    error AlreadyClaimed();
    error NoPrediction();
    error AlreadyPredicted();
    error OnlyHookCanModifyLiquidity();
    error ZeroAmount();

    event EventCreated(bytes32 indexed eventId, string name, uint8 numOutcomes, uint256 deadline);
    event PredictionMade(
        bytes32 indexed eventId, address indexed user, uint8 outcome, uint256 amount0, uint256 amount1
    );
    event EventResolved(bytes32 indexed eventId, uint8 winningOutcome);
    event EventSettled(bytes32 indexed eventId, uint256 totalReturn0, uint256 totalReturn1);
    event Claimed(bytes32 indexed eventId, address indexed user, uint256 payout0, uint256 payout1, bool isWinner);
    event SwapTracked(bytes32 indexed eventId, uint256 cumulativeSwapCount);

    uint8 internal constant ACTION_ADD_LIQUIDITY = 1;
    uint8 internal constant ACTION_REMOVE_LIQUIDITY = 2;

    IPoolManager public immutable poolManager;
    address public owner;

    struct PredictionEvent {
        string name;
        PoolKey poolKey;
        uint8 numOutcomes;
        uint8 winningOutcome;
        bool resolved;
        bool settled;
        uint256 deadline;
        uint256 totalDeposit0;
        uint256 totalDeposit1;
        uint128 totalLiquidity;
        uint256 totalReturn0;
        uint256 totalReturn1;
        uint256 swapCount;
        int24 tickLower;
        int24 tickUpper;
    }

    struct UserPrediction {
        uint8 outcome;
        uint256 deposit0;
        uint256 deposit1;
        bool claimed;
        bool exists;
    }

    mapping(bytes32 => PredictionEvent) internal _events;
    mapping(bytes32 => mapping(address => UserPrediction)) public predictions;
    mapping(bytes32 => mapping(uint8 => uint256)) public depositsPerOutcome0;
    mapping(bytes32 => mapping(uint8 => uint256)) public depositsPerOutcome1;
    mapping(PoolId => bytes32) public poolEventIds;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        owner = msg.sender;
        Hooks.validateHookPermissions(IHooks(address(this)), _hookPermissions());
    }

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    error ZeroAddress();

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    // ─── Event Management ───────────────────────────────────────────────

    function createEvent(
        bytes32 eventId,
        string calldata name,
        uint8 numOutcomes,
        uint256 deadline,
        PoolKey calldata poolKey
    ) external onlyOwner {
        if (_events[eventId].numOutcomes != 0) revert EventAlreadyExists();
        if (numOutcomes < 2) revert InvalidOutcome();

        int24 spacing = poolKey.tickSpacing;
        int24 tickLower = (TickMath.MIN_TICK / spacing) * spacing;
        int24 tickUpper = (TickMath.MAX_TICK / spacing) * spacing;

        _events[eventId] = PredictionEvent({
            name: name,
            poolKey: poolKey,
            numOutcomes: numOutcomes,
            winningOutcome: 0,
            resolved: false,
            settled: false,
            deadline: deadline,
            totalDeposit0: 0,
            totalDeposit1: 0,
            totalLiquidity: 0,
            totalReturn0: 0,
            totalReturn1: 0,
            swapCount: 0,
            tickLower: tickLower,
            tickUpper: tickUpper
        });

        poolEventIds[poolKey.toId()] = eventId;
        emit EventCreated(eventId, name, numOutcomes, deadline);
    }

    function resolveEvent(bytes32 eventId, uint8 winningOutcome) external onlyOwner {
        PredictionEvent storage evt = _events[eventId];
        if (evt.numOutcomes == 0) revert EventNotFound();
        if (evt.resolved) revert EventAlreadyResolved();
        if (block.timestamp <= evt.deadline) revert DeadlineNotPassed();
        if (winningOutcome >= evt.numOutcomes) revert InvalidOutcome();

        evt.resolved = true;
        evt.winningOutcome = winningOutcome;
        emit EventResolved(eventId, winningOutcome);
    }

    // ─── Predict ────────────────────────────────────────────────────────

    function predict(bytes32 eventId, uint8 outcome, uint256 amount0, uint256 amount1) external {
        PredictionEvent storage evt = _events[eventId];
        if (evt.numOutcomes == 0) revert EventNotFound();
        if (evt.resolved) revert EventAlreadyResolved();
        if (block.timestamp > evt.deadline) revert DeadlinePassed();
        if (outcome >= evt.numOutcomes) revert InvalidOutcome();
        if (predictions[eventId][msg.sender].exists) revert AlreadyPredicted();
        if (amount0 == 0 && amount1 == 0) revert ZeroAmount();

        IERC20(Currency.unwrap(evt.poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(Currency.unwrap(evt.poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amount1);

        bytes memory result = poolManager.unlock(abi.encode(ACTION_ADD_LIQUIDITY, eventId, amount0, amount1));
        uint128 liquidityAdded = abi.decode(result, (uint128));

        evt.totalDeposit0 += amount0;
        evt.totalDeposit1 += amount1;
        evt.totalLiquidity += liquidityAdded;

        predictions[eventId][msg.sender] =
            UserPrediction({outcome: outcome, deposit0: amount0, deposit1: amount1, claimed: false, exists: true});

        depositsPerOutcome0[eventId][outcome] += amount0;
        depositsPerOutcome1[eventId][outcome] += amount1;

        emit PredictionMade(eventId, msg.sender, outcome, amount0, amount1);
    }

    // ─── Settle ─────────────────────────────────────────────────────────

    function settleEvent(bytes32 eventId) external {
        PredictionEvent storage evt = _events[eventId];
        if (evt.numOutcomes == 0) revert EventNotFound();
        if (!evt.resolved) revert EventNotResolved();
        if (evt.settled) revert EventAlreadySettled();

        uint256 bal0Before = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
        uint256 bal1Before = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

        poolManager.unlock(abi.encode(ACTION_REMOVE_LIQUIDITY, eventId, uint256(0), uint256(0)));

        uint256 bal0After = IERC20(Currency.unwrap(evt.poolKey.currency0)).balanceOf(address(this));
        uint256 bal1After = IERC20(Currency.unwrap(evt.poolKey.currency1)).balanceOf(address(this));

        evt.totalReturn0 = bal0After - bal0Before;
        evt.totalReturn1 = bal1After - bal1Before;
        evt.settled = true;

        emit EventSettled(eventId, evt.totalReturn0, evt.totalReturn1);
    }

    // ─── Claim ──────────────────────────────────────────────────────────

    function claim(bytes32 eventId) external {
        PredictionEvent storage evt = _events[eventId];
        if (evt.numOutcomes == 0) revert EventNotFound();
        if (!evt.settled) revert EventNotSettled();

        UserPrediction storage pred = predictions[eventId][msg.sender];
        if (!pred.exists) revert NoPrediction();
        if (pred.claimed) revert AlreadyClaimed();
        pred.claimed = true;

        bool isWinner = pred.outcome == evt.winningOutcome;
        (uint256 payout0, uint256 payout1) = _calculatePayout(eventId, evt, pred, isWinner);

        if (payout0 > 0) {
            IERC20(Currency.unwrap(evt.poolKey.currency0)).safeTransfer(msg.sender, payout0);
        }
        if (payout1 > 0) {
            IERC20(Currency.unwrap(evt.poolKey.currency1)).safeTransfer(msg.sender, payout1);
        }

        emit Claimed(eventId, msg.sender, payout0, payout1, isWinner);
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

    // ─── Hook Callbacks ─────────────────────────────────────────────────

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4) {
        if (sender != address(this)) revert OnlyHookCanModifyLiquidity();
        return IHooks.beforeAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external view onlyPoolManager returns (bytes4) {
        if (sender != address(this)) revert OnlyHookCanModifyLiquidity();
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function afterSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        external
        onlyPoolManager
        returns (bytes4, int128)
    {
        bytes32 eventId = poolEventIds[key.toId()];
        if (eventId != bytes32(0)) {
            _events[eventId].swapCount++;
            emit SwapTracked(eventId, _events[eventId].swapCount);
        }
        return (IHooks.afterSwap.selector, 0);
    }

    // ─── Unused Hook Callbacks (required by IHooks) ─────────────────────

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

    // ─── Unlock Callback ────────────────────────────────────────────────

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

        return abi.encode(liquidity);
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
            evt.deadline,
            evt.totalDeposit0,
            evt.totalDeposit1,
            evt.totalReturn0,
            evt.totalReturn1,
            evt.swapCount
        );
    }

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
