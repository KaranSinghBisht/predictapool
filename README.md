# PredictaPool

**Principal-Protected Prediction Markets Powered by Uniswap V4 LP Yield**

Built for the [Hook the Future](https://web3.okx.com/xlayer/build-x-hackathon/hook) hackathon by X Layer, Uniswap, and Flap.

## What is PredictaPool?

PredictaPool is a Uniswap V4 Hook that creates **principal-protected prediction markets** where your prediction capital earns real LP yield while you wait for the result.

- **Predict** a FIFA World Cup outcome (or any event)
- **Earn** real swap fees as your deposit becomes Uniswap V4 liquidity
- **Win** and receive boosted yield from the entire pool
- **Lose** and still get your principal back - you only miss out on yield (in rare cases of extreme impermanent loss, principal may be slightly reduced; for stablecoin pools this risk is negligible)

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
| Principal risk | Lose entire bet | Principal-protected (minimal IL risk) |
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

## Deployed Contracts (X Layer Testnet - Chain 1952)

| Contract | Address |
|----------|---------|
| PredictaPoolHook | [`0x88dCC9995D81cBd0C54598B3C6048894E0308a40`](https://www.oklink.com/xlayer-test/address/0x88dCC9995D81cBd0C54598B3C6048894E0308a40) |
| Token 0 (ppUSDC) | [`0x6711b09235DdA76f2A71d005C4fde76566CBE185`](https://www.oklink.com/xlayer-test/address/0x6711b09235DdA76f2A71d005C4fde76566CBE185) |
| Token 1 (ppWETH) | [`0xEe8dDA62A3F837a40dd1889a50aDF57bf0b30B57`](https://www.oklink.com/xlayer-test/address/0xEe8dDA62A3F837a40dd1889a50aDF57bf0b30B57) |
| V4 PoolManager | [`0xdC53623F92AD1959c4F257b57900cd11C056926d`](https://www.oklink.com/xlayer-test/address/0xdC53623F92AD1959c4F257b57900cd11C056926d) |
| SwapRouter | [`0x8a4F428060133c22d6d69aD7102A82548fa8318B`](https://www.oklink.com/xlayer-test/address/0x8a4F428060133c22d6d69aD7102A82548fa8318B) |

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

### Run Demo Transactions

```bash
export HOOK_ADDRESS=<deployed_hook>
export TOKEN0_ADDRESS=<token0>
export TOKEN1_ADDRESS=<token1>
export SWAP_ROUTER_ADDRESS=<swap_router>
forge script script/Demo.s.sol --rpc-url https://testrpc.xlayer.tech --broadcast
```

## X Layer

- **Mainnet**: Chain ID 196 | RPC: `https://rpc.xlayer.tech`
- **Testnet**: Chain ID 1952 | RPC: `https://testrpc.xlayer.tech`
- **Explorer**: [oklink.com/xlayer](https://www.oklink.com/xlayer)
- **Faucet**: [web3.okx.com/xlayer/faucet](https://web3.okx.com/xlayer/faucet)

## License

MIT
