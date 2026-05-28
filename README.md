# PredictaPool

**Yield-Backed Prediction Markets Powered by Uniswap V4 LP Yield**

Built for the [Hook the Future](https://web3.okx.com/xlayer/build-x-hackathon/hook) hackathon by X Layer, Uniswap, and Flap.

## What is PredictaPool?

PredictaPool is a Uniswap V4 Hook that creates **yield-backed prediction markets** where your prediction capital earns real LP yield while you wait for the result.

- **Predict** a FIFA World Cup outcome (or any event)
- **Earn** real swap fees as your deposit becomes Uniswap V4 liquidity
- **Win** and receive boosted yield from the entire pool
- **Lose** and get your principal back — principal-targeted for stable pairs; volatile pairs are exposed to impermanent loss

### How it works

```
1. CREATE EVENT    Admin creates a prediction event (e.g., "Argentina vs Brazil")
2. PREDICT         Users deposit tokens + pick an outcome
                   -> Deposits become LP in a Uniswap V4 pool
3. EARN            Traders swap in the pool, generating fees for LPs
4. RESOLVE         Oracle reports the match result
5. CLAIM           Winners: principal + ALL earned fees
                   Losers:  principal returned (IL-exposed on volatile pairs)
```

### Why not Polymarket?

| Feature | Polymarket (sports) | PredictaPool |
|---------|-------------------|--------------|
| Yield on predictions | None (0%) | Real LP swap fees |
| Principal risk | Lose entire bet | Principal-targeted (minimal IL risk on stable pairs) |
| Yield source | N/A | Protocol-native AMM fees |
| Permissionless | Platform-locked | Fully on-chain |

## Architecture

### Hook Callbacks

| Callback | Purpose |
|----------|---------|
| `beforeSwap` | **Governs every swap** — sets a deadline-aware dynamic fee and locks trading once the event resolves/settles/cancels |
| `beforeAddLiquidity` | Access control — only the Hook can add LP |
| `beforeRemoveLiquidity` | Access control — only the Hook can remove LP |
| `afterSwap` | Emits per-swap yield telemetry (`YieldBoosted`) + swap count |

### Contracts

| Contract | Description |
|----------|-------------|
| `PredictaPoolHook.sol` | Core V4 Hook with prediction + yield redistribution |
| `MockERC20.sol` | Test ERC20 tokens for deployment |

## Technical Deep Dive

### Why This Hook Design Works

PredictaPool's hook **governs the swap itself** — the pool's economics and lifecycle are decided on-chain by the event state. This is what makes it a prediction market rather than a plain pool with a side-pot:

**1. Hook-driven dynamic fee + lifecycle gate (`beforeSwap`)** — the headline mechanic

On a dynamic-fee pool, `beforeSwap` returns the LP fee for each swap, ramping linearly from 0.30% to 1.00% over the final 7 days before kickoff — so peak match hype funds a bigger prize. The same callback **closes trading** (reverts `TradingClosed`) once the event is resolved/settled/cancelled, binding the pool's life to the match. A plain pool cannot price swaps off event state or lock trading — only a hook sees `beforeSwap`.

> Dynamic fees are a known V4 pattern; the novelty here is the *coupling* — fee schedule and trading lifecycle are driven by a live prediction event, and because the hook is the pool's only LP, 100% of the fee becomes prize yield via the existing `claim()` path.

```
beforeSwap: if resolved/settled/cancelled → revert TradingClosed
            else fee = ramp(timeToDeadline)  // 0.30% → 1.00%, override flag set
```

**2. LP Access Control (`beforeAddLiquidity` / `beforeRemoveLiquidity`)**

The hook enforces that only the contract itself can add or remove liquidity. External LPs are blocked, so every unit of liquidity comes from a predictor — yield attribution is exact.

**3. Yield Telemetry (`afterSwap`)**

Each swap increments a per-event counter and emits `YieldBoosted(eventId, swapper, feePips, swapCount)`, making the prize build-up verifiable on-chain per swap. Actual yield is realized at settlement by comparing total LP returns against deposits.

**3. Atomic LP via `unlockCallback`**

The predict and settle flows use V4's unlock mechanism for atomic operations:

```
predict() → poolManager.unlock() → unlockCallback(ACTION_ADD_LIQUIDITY)
  └→ getLiquidityForAmounts() → modifyLiquidity() → settleDelta()
  └→ Refund unused tokens to predictor

settleEvent() → poolManager.unlock() → unlockCallback(ACTION_REMOVE_LIQUIDITY)
  └→ modifyLiquidity(negative) → takeDelta()
  └→ Deduct protocol fee from yield → Record totalReturn
```

**4. Yield Redistribution (`claim`)**

The claim algorithm separates principal from yield:

- **Principal**: Distributed proportionally to ALL depositors (winners and losers) based on their share of total deposits. If IL caused returns < deposits, everyone shares the loss proportionally.
- **Yield**: The surplus above principal goes exclusively to winners, proportional to their deposit in the winning outcome pool.
- **No winners**: If nobody predicted correctly, yield is distributed proportionally to all depositors.
- **Last claimer**: Gets the actual remaining balance, preventing dust from rounding errors.

This design ensures losers always get their principal back (minus IL on volatile pairs), while winners capture all the yield generated during the prediction period.

### Test Coverage

92 tests covering the full contract surface:
- Lifecycle: create → predict → swap → resolve → settle → claim
- Dynamic fee: base/ramp/peak schedule, swap fee override on dynamic pools
- Lifecycle gate: swaps revert once resolved/settled/cancelled
- Telemetry: `YieldBoosted` emission + swap count
- Protocol fees: deduction from yield, max fee cap, zero-fee mode
- Cancellation: owner cancel, auto-expiry, proportional refunds
- Edge cases: MIN_DEPOSIT, same-user stacking, no-winners distribution
- Access control: pause/unpause, ownership transfer chains
- Fuzz testing: random deposit ratios and swap sequences

## Social

Follow the build journey: [@PredictaPool](https://x.com/PredictaPool) | Tags: @XLayerOfficial @Uniswap @flapdotsh

Build-in-public posts:
- [Day 1: Introducing PredictaPool](https://x.com/PredictaPool) — launch announcement
- [Day 2: How It Works](https://x.com/PredictaPool) — Hook callbacks deep dive
- [Day 3: Smart Deposit Refunds](https://x.com/PredictaPool) — BalanceDelta refund mechanism

## Deployed Contracts (X Layer Testnet - Chain 1952)

| Contract | Address |
|----------|---------|
| PredictaPoolHook v2 (dynamic-fee, active) | [`0x26b7228e75c5Ba4f256aa88b7141290518D70Ac0`](https://www.oklink.com/xlayer-test/address/0x26b7228e75c5Ba4f256aa88b7141290518D70Ac0) |
| PredictaPoolHook v1 (original) | [`0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40`](https://www.oklink.com/xlayer-test/address/0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40) |
| Token 0 (ppUSDC) | [`0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6`](https://www.oklink.com/xlayer-test/address/0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6) |
| Token 1 (ppWETH) | [`0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12`](https://www.oklink.com/xlayer-test/address/0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12) |
| V4 PoolManager | [`0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92`](https://www.oklink.com/xlayer-test/address/0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92) |
| SwapRouter | [`0x9836796875956DEF7CED74C758f9E04682Dfbe2e`](https://www.oklink.com/xlayer-test/address/0x9836796875956DEF7CED74C758f9E04682Dfbe2e) |
| EventId (live, v2 dynamic-fee) | `0x8e7d3d968700fe8f2e70bd7e29ab516930388419d00a6133a266bc504435a38b` |
| EventId (v1, original) | `0x7e62176d34f6ec0157e28f14dc9d431dfedc1dff4cfe9fab73c5c259186e8864` |
| EventId (demo, full lifecycle) | `0x3b1a30d71ca4dc87a0c9aa60aad7889d629dabd724b879101896d04c54eeb070` |

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Solidity 0.8.26+

### Build

```bash
forge build
```

### Test

```bash
forge test -vvv
```

### Deploy to X Layer Testnet

```bash
export DEPLOYER_PRIVATE_KEY=<your_private_key>
forge script script/DeployTestnet.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast
```

### Run Demo Lifecycle

The full prediction lifecycle (create event, predict, swap, resolve, settle, claim) requires three steps with time delays:

```bash
# Step 1: Create a short-deadline demo event + predict + swap
forge script script/DemoCreateEvent.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

# Step 2: Resolve the event (run after the 10-minute deadline passes)
forge script script/DemoResolveEvent.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast

# Step 3: Settle and claim (run 1 hour after resolve)
forge script script/DemoSettleClaim.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast
```

## X Layer

- **Mainnet**: Chain ID 196 | RPC: `https://rpc.xlayer.tech`
- **Testnet**: Chain ID 1952 | RPC: `https://testrpc.xlayer.tech`
- **Explorer**: [oklink.com/xlayer](https://www.oklink.com/xlayer)
- **Faucet**: [web3.okx.com/xlayer/faucet](https://web3.okx.com/xlayer/faucet)

## Judge Verification (On-Chain Proof)

Every step of the prediction lifecycle is verifiable on [X Layer Testnet Explorer](https://www.oklink.com/xlayer-test):

| Step | Transaction |
|------|-------------|
| Create Event (live) | [`0xcd3e7e...`](https://www.oklink.com/xlayer-test/tx/0xcd3e7ec24f0a5219bcdbbef097c8bb1c1039effeecdfe828c0934fcd953c64ca) |
| Predict (Argentina wins) | [`0x15e4b2...`](https://www.oklink.com/xlayer-test/tx/0x15e4b26d7c240be40eb6c53b68e58da1fb84ae1e784a74f7daa80a46e46a22e9) |
| Swap (token0 → token1) | [`0xca7ed2...`](https://www.oklink.com/xlayer-test/tx/0xca7ed2eb54c7edc3aa96fb0cf7650b2f9313da79e3558868659798a0dc0b478d) |
| Swap (token1 → token0) | [`0x5df568...`](https://www.oklink.com/xlayer-test/tx/0x5df568facd1d005b87590e5c4d25fdf3271519bed0bb09335cd59d282a1fafc8) |
| Create Demo Event | [`0x8b4854...`](https://www.oklink.com/xlayer-test/tx/0x8b485445f2d64b9a69599dde8efda8cb7f5d01354341dbe56e1630802f7ac0df) |
| Demo Predict | [`0xa94003...`](https://www.oklink.com/xlayer-test/tx/0xa94003fd928e3917d0f3c81c87ba64a523ad1ef6d7f83898a69b1f495473b1a7) |
| Resolve Demo | [`0x7cc834...`](https://www.oklink.com/xlayer-test/tx/0x7cc834d41e4f4c97d69a8aa6c70ed940078a5297917f46ca0d91e46f4fb0169a) |
| Settle Demo | [`0xa7007c...`](https://www.oklink.com/xlayer-test/tx/0xa7007c6d027033938b828dedd880bc80c94f4bf10d1392c77844fb07addc223d) |
| Claim Demo | [`0xb78bba...`](https://www.oklink.com/xlayer-test/tx/0xb78bbad738a1f4cefa9bb05812a662a4b6dbffff8d9161d26d2a9c20d7221449) |

**Note:** X Layer testnet does not have an official Uniswap V4 deployment, so we deploy our own PoolManager. The Hook contract, pool initialization, and all callback behavior are identical to what would run against the official V4 PoolManager.

## Known Limitations

This is a hackathon prototype. Production deployment would require:

- **Oracle**: Owner acts as the oracle for event resolution. A production version would use UMA optimistic oracle, Chainlink, or a commit-reveal scheme with a dispute window.
- **Impermanent Loss**: Principal protection assumes stable asset pairs. For volatile pairs, IL can reduce total returns below deposited principal. The contract handles this gracefully (proportional distribution), but users should be aware.
- **Test Tokens**: Deployed tokens (ppWETH, ppUSDC) are mock ERC20s with public `mint`. They have no real value.
- **Testnet Only**: Deployed on X Layer testnet (chain 1952). Not audited for mainnet use.

## License

MIT
