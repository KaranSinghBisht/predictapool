import { ethers } from "ethers";
import {
  XLAYER_TESTNET,
  ADDRESSES,
  HOOK_ABI,
  ERC20_ABI,
  EVENT_ID,
} from "./contracts";

export const readProvider = new ethers.JsonRpcProvider(XLAYER_TESTNET.rpc);
export const readHook = new ethers.Contract(
  ADDRESSES.hook,
  HOOK_ABI,
  readProvider,
);

export async function connectWallet() {
  if (!window.ethereum) throw new Error("Please install MetaMask");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: XLAYER_TESTNET.chainIdHex }],
    });
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: XLAYER_TESTNET.chainIdHex,
            chainName: XLAYER_TESTNET.name,
            nativeCurrency: XLAYER_TESTNET.nativeCurrency,
            rpcUrls: [XLAYER_TESTNET.rpc],
            blockExplorerUrls: [XLAYER_TESTNET.explorer],
          },
        ],
      });
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

export function getContracts(signer: ethers.Signer) {
  return {
    hook: new ethers.Contract(ADDRESSES.hook, HOOK_ABI, signer),
    token0: new ethers.Contract(ADDRESSES.token0, ERC20_ABI, signer),
    token1: new ethers.Contract(ADDRESSES.token1, ERC20_ABI, signer),
  };
}

export interface EventData {
  name: string;
  numOutcomes: number;
  winningOutcome: number;
  resolved: boolean;
  settled: boolean;
  cancelled: boolean;
  deadline: number;
  totalDeposit0: bigint;
  totalDeposit1: bigint;
  totalReturn0: bigint;
  totalReturn1: bigint;
  swapCount: number;
  feePips: number;
}

type EventTuple = readonly [
  string,
  bigint,
  bigint,
  boolean,
  boolean,
  boolean,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

export async function fetchEvent(): Promise<EventData> {
  // NOTE: `getEvent` is a reserved method on ethers v6 Contract (event lookup),
  // so we must call the ABI function explicitly via getFunction to avoid a
  // silent "no matching event" throw.
  const [evt, feePips] = (await Promise.all([
    readHook.getFunction("getEvent").staticCall(EVENT_ID),
    readHook.currentFeePips(EVENT_ID).catch(() => 0n),
  ])) as unknown as [EventTuple, bigint];
  return {
    name: evt[0],
    numOutcomes: Number(evt[1]),
    winningOutcome: Number(evt[2]),
    resolved: evt[3],
    settled: evt[4],
    cancelled: evt[5],
    deadline: Number(evt[6]),
    totalDeposit0: evt[7],
    totalDeposit1: evt[8],
    totalReturn0: evt[9],
    totalReturn1: evt[10],
    swapCount: Number(evt[11]),
    feePips: Number(feePips),
  };
}

export interface UserPrediction {
  outcome: number;
  deposit0: bigint;
  deposit1: bigint;
  claimed: boolean;
  exists: boolean;
}

export async function fetchUserPrediction(
  address: string,
): Promise<UserPrediction> {
  const pred = await readHook.predictions(EVENT_ID, address);
  return {
    outcome: Number(pred[0]),
    deposit0: pred[1],
    deposit1: pred[2],
    claimed: pred[3],
    exists: pred[4],
  };
}

export async function fetchOutcomeDeposits(): Promise<bigint[]> {
  const deposits = await Promise.all(
    [0, 1, 2].map((i) =>
      readHook.depositsPerOutcome0(EVENT_ID, i).catch(() => 0n),
    ),
  );
  return deposits;
}

export async function fetchBalances(address: string) {
  const readToken0 = new ethers.Contract(
    ADDRESSES.token0,
    ERC20_ABI,
    readProvider,
  );
  const readToken1 = new ethers.Contract(
    ADDRESSES.token1,
    ERC20_ABI,
    readProvider,
  );
  const [b0, b1, bNative] = await Promise.all([
    readToken0.balanceOf(address),
    readToken1.balanceOf(address),
    readProvider.getBalance(address),
  ]);
  return { token0: b0 as bigint, token1: b1 as bigint, native: bNative };
}

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}
