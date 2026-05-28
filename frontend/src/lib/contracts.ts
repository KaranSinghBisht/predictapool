export const XLAYER_TESTNET = {
  chainId: 1952,
  chainIdHex: "0x7A0",
  name: "X Layer Testnet",
  rpc: "https://testrpc.xlayer.tech",
  explorer: "https://www.oklink.com/xlayer-test",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
};

export const ADDRESSES = {
  hook: "0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40",
  token0: "0x573b5717Ff7e1C70573234Dc68aa064f70AbfeF6",
  token1: "0x71642C9FeB621D9A5d536d7A255C573c16C6Fd12",
  poolManager: "0x640c8A28f81D7E7087AEec0d6A9D9efdA1694B92",
  swapRouter: "0x9836796875956DEF7CED74C758f9E04682Dfbe2e",
} as const;

export const EVENT_ID =
  "0x7e62176d34f6ec0157e28f14dc9d431dfedc1dff4cfe9fab73c5c259186e8864";

// Real, verifiable contracts shown in the "Verify on-chain" panel.
export const CONTRACT_LINKS = [
  { label: "PredictaPool Hook", addr: ADDRESSES.hook },
  { label: "V4 PoolManager", addr: ADDRESSES.poolManager },
  { label: "ppUSDC · token0", addr: ADDRESSES.token0 },
  { label: "ppWETH · token1", addr: ADDRESSES.token1 },
  { label: "SwapRouter", addr: ADDRESSES.swapRouter },
] as const;

// Full prediction lifecycle, each step verifiable on X Layer testnet.
// Create / Predict / Swap are from the live Argentina vs Brazil event;
// Resolve / Settle / Claim are from a completed demo event (the live event
// is still open for predictions).
export const LIFECYCLE_TXS = [
  {
    step: "Create",
    label: "Create event",
    hash: "0xcd3e7ec24f0a5219bcdbbef097c8bb1c1039effeecdfe828c0934fcd953c64ca",
    live: true,
  },
  {
    step: "Predict",
    label: "Predict · Argentina",
    hash: "0x15e4b26d7c240be40eb6c53b68e58da1fb84ae1e784a74f7daa80a46e46a22e9",
    live: true,
  },
  {
    step: "Swap",
    label: "Swap · generate yield",
    hash: "0xca7ed2eb54c7edc3aa96fb0cf7650b2f9313da79e3558868659798a0dc0b478d",
    live: true,
  },
  {
    step: "Resolve",
    label: "Resolve outcome",
    hash: "0x7cc834d41e4f4c97d69a8aa6c70ed940078a5297917f46ca0d91e46f4fb0169a",
    live: false,
  },
  {
    step: "Settle",
    label: "Settle event",
    hash: "0xa7007c6d027033938b828dedd880bc80c94f4bf10d1392c77844fb07addc223d",
    live: false,
  },
  {
    step: "Claim",
    label: "Claim payout",
    hash: "0xb78bbad738a1f4cefa9bb05812a662a4b6dbffff8d9161d26d2a9c20d7221449",
    live: false,
  },
] as const;

export const OUTCOMES = [
  {
    label: "Argentina Win",
    emoji: "\u{1F1E6}\u{1F1F7}",
    color: "from-blue-500 to-blue-700",
  },
  { label: "Draw", emoji: "\u{1F91D}", color: "from-gray-500 to-gray-700" },
  {
    label: "Brazil Win",
    emoji: "\u{1F1E7}\u{1F1F7}",
    color: "from-yellow-500 to-green-600",
  },
];

export const HOOK_ABI = [
  "function getEvent(bytes32) view returns (string,uint8,uint8,bool,bool,bool,uint256,uint256,uint256,uint256,uint256,uint256)",
  "function predictions(bytes32,address) view returns (uint8,uint256,uint256,bool,bool)",
  "function predict(bytes32,uint8,uint256,uint256)",
  "function claim(bytes32)",
  "function depositsPerOutcome0(bytes32,uint8) view returns (uint256)",
];

export const ERC20_ABI = [
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function mint(address,uint256)",
];

// PoolSwapTest router — the "Boost the pool" button runs a real swap through
// this, which fires the hook's afterSwap (swapCount++ and real LP fees).
export const SWAP_ROUTER_ABI = [
  "function swap((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) key,(bool zeroForOne,int256 amountSpecified,uint160 sqrtPriceLimitX96) params,(bool takeClaims,bool settleUsingBurn) testSettings,bytes hookData) payable returns (int256)",
];

// PoolKey tuple for the live ppUSDC/ppWETH pool (currency0 < currency1).
export const POOL_KEY: readonly [string, string, number, number, string] = [
  ADDRESSES.token0,
  ADDRESSES.token1,
  3000,
  60,
  ADDRESSES.hook,
];

// TickMath.MIN_SQRT_PRICE + 1 and MAX_SQRT_PRICE - 1 (full-range price limits).
export const SQRT_PRICE_LIMIT = {
  min: 4295128740n,
  max: 1461446703485210103287273052203988822378723970341n,
};

export function explorerTx(hash: string) {
  return `${XLAYER_TESTNET.explorer}/tx/${hash}`;
}

export function explorerAddr(addr: string) {
  return `${XLAYER_TESTNET.explorer}/address/${addr}`;
}
