# PredictaPool

**Yield-Backed Prediction Markets Powered by Uniswap V4 LP Yield**

Built for the [Hook the Future](https://web3.okx.com/xlayer/build-x-hackathon/hook) hackathon by X Layer, Uniswap, and Flap.

## What is PredictaPool?

PredictaPool is a Uniswap V4 Hook that creates **yield-backed prediction markets** where your prediction capital earns real LP yield while you wait for the result.

- **Predict** a FIFA World Cup outcome (or any event)
- **Earn** real swap fees as your deposit becomes Uniswap V4 liquidity
- **Win** and receive boosted yield from the entire pool
- **Lose** and get your principal back — you risk only yield, not principal (for volatile pairs, impermanent loss can reduce returns below deposit; for stablecoin pairs this risk is minimal)

### How it works

```
1. CREATE EVENT    Admin creates a prediction event (e.g., "Argentina vs Brazil")
2. PREDICT         Users deposit tokens + pick an outcome
                   -> Deposits become LP in a Uniswap V4 pool
3. EARN            Traders swap in the pool, generating fees for LPs
4. RESOLVE         Oracle reports the match result
5. CLAIM           Winners: principal + ALL earned fees
                   Losers:  principal returned (principal-protected)
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
| `beforeAddLiquidity` | Access control - only Hook can manage LP |
| `beforeRemoveLiquidity` | Access control - only Hook can remove LP |
| `afterSwap` | Track swap activity for yield analytics |

### Contracts

| Contract | Description |
|----------|-------------|
| `PredictaPoolHook.sol` | Core V4 Hook with prediction + yield redistribution |
| `MockERC20.sol` | Test ERC20 tokens for deployment |

## Social

Follow the build journey: [@PredictaPool](https://x.com/PredictaPool)

## Deployed Contracts (X Layer Testnet - Chain 1952)

| Contract | Address |
|----------|---------|
| PredictaPoolHook | [`0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40`](https://www.oklink.com/xlayer-test/address/0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40) |
| Token 0 (ppUSDC) | [`0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6`](https://www.oklink.com/xlayer-test/address/0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6) |
| Token 1 (ppWETH) | [`0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12`](https://www.oklink.com/xlayer-test/address/0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12) |
| V4 PoolManager | [`0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92`](https://www.oklink.com/xlayer-test/address/0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92) |
| SwapRouter | [`0x9836796875956DEF7CED74C758f9E04682Dfbe2e`](https://www.oklink.com/xlayer-test/address/0x9836796875956DEF7CED74C758f9E04682Dfbe2e) |
| EventId (live) | `0x7e62176d34f6ec0157e28f14dc9d431dfedc1dff4cfe9fab73c5c259186e8864` |
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
| Deploy Hook + Pool + Tokens | [`0x4ec8a6...`](https://www.oklink.com/xlayer-test/tx/0x4ec8a66e52228519b39eb7a9a3e974c03af9cf4d85945bfa88093841c09e1eb4) |
| Predict (Argentina) + Swaps | [`0x89dbb6...`](https://www.oklink.com/xlayer-test/tx/0x89dbb6444a47fe769ec899c671f33f1befbbd92664925ce8f3ae3fd08d753a4c) |
| Create Demo Event | [`0xb45306...`](https://www.oklink.com/xlayer-test/tx/0xb45306707046e8d0016ec2881a8ed46bcd185f69ca9a89aad1ab8dbaf34e1842) |
| Resolve Demo Event | [`0x7cc834...`](https://www.oklink.com/xlayer-test/tx/0x7cc834d41e4f4c97d69a8aa6c70ed940078a5297917f46ca0d91e46f4fb0169a) |
| Settle + Claim Demo Event | [`0xa7007c...`](https://www.oklink.com/xlayer-test/tx/0xa7007c6d027033938b828dedd880bc80c94f4bf10d1392c77844fb07addc223d) |

**Note:** X Layer testnet does not have an official Uniswap V4 deployment, so we deploy our own PoolManager. The Hook contract, pool initialization, and all callback behavior are identical to what would run against the official V4 PoolManager.

## Known Limitations

This is a hackathon prototype. Production deployment would require:

- **Oracle**: Owner acts as the oracle for event resolution. A production version would use UMA optimistic oracle, Chainlink, or a commit-reveal scheme with a dispute window.
- **Impermanent Loss**: Principal protection assumes stable asset pairs. For volatile pairs, IL can reduce total returns below deposited principal. The contract handles this gracefully (proportional distribution), but users should be aware.
- **Test Tokens**: Deployed tokens (ppWETH, ppUSDC) are mock ERC20s with public `mint`. They have no real value.
- **Testnet Only**: Deployed on X Layer testnet (chain 1952). Not audited for mainnet use.

## License

MIT
