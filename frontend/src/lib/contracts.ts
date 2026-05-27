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
} as const;

export const EVENT_ID =
  "0x7e62176d34f6ec0157e28f14dc9d431dfedc1dff4cfe9fab73c5c259186e8864";

export const OUTCOMES = [
  { label: "Argentina Win", emoji: "\u{1F1E6}\u{1F1F7}", color: "from-blue-500 to-blue-700" },
  { label: "Draw", emoji: "\u{1F91D}", color: "from-gray-500 to-gray-700" },
  { label: "Brazil Win", emoji: "\u{1F1E7}\u{1F1F7}", color: "from-yellow-500 to-green-600" },
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

export function explorerTx(hash: string) {
  return `${XLAYER_TESTNET.explorer}/tx/${hash}`;
}

export function explorerAddr(addr: string) {
  return `${XLAYER_TESTNET.explorer}/address/${addr}`;
}
