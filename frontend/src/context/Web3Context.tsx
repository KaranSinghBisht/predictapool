"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ethers } from "ethers";
import {
  connectWallet as connectWalletFn,
  getContracts,
  fetchEvent,
  fetchUserPrediction,
  fetchOutcomeDeposits,
  fetchBalances,
} from "@/lib/web3";
import type { EventData, UserPrediction } from "@/lib/web3";
import {
  ADDRESSES,
  EVENT_ID,
  ERC20_ABI,
  SWAP_ROUTER_ABI,
  POOL_KEY,
  SQRT_PRICE_LIMIT,
} from "@/lib/contracts";

const MINT_AMOUNT = ethers.parseEther("1000");
const POLL_MS = 30_000;

interface Web3ContextType {
  address: string | null;
  connectError: string;
  eventData: EventData | null;
  outcomeDeposits: bigint[];
  prediction: UserPrediction | null;
  balances: { token0: bigint; token1: bigint; native: bigint } | null;
  selectedOutcome: number | null;
  depositAmount: string;
  isApproved: boolean;
  isApproving: boolean;
  isPredicting: boolean;
  isClaiming: boolean;
  isMinting: boolean;
  txStatus: string;
  txHash: string | null;
  claimStatus: string;
  mintStatus: string;
  handleConnect: () => Promise<void>;
  handleApprove: () => Promise<void>;
  handlePredict: () => Promise<void>;
  handleClaim: () => Promise<void>;
  handleMint: () => Promise<void>;
  handleSelectOutcome: (i: number) => void;
  handleDepositChange: (v: string) => void;
  isBoosting: boolean;
  boostStatus: string;
  boostTxHash: string | null;
  handleBoost: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connectError, setConnectError] = useState("");
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [outcomeDeposits, setOutcomeDeposits] = useState<bigint[]>([
    0n,
    0n,
    0n,
  ]);
  const [prediction, setPrediction] = useState<UserPrediction | null>(null);
  const [balances, setBalances] = useState<{
    token0: bigint;
    token1: bigint;
    native: bigint;
  } | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState("");
  const [mintStatus, setMintStatus] = useState("");
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostStatus, setBoostStatus] = useState("");
  const [boostTxHash, setBoostTxHash] = useState<string | null>(null);

  const refreshChainData = useCallback(
    async (addr?: string) => {
      const [evt, deposits] = await Promise.all([
        fetchEvent(),
        fetchOutcomeDeposits(),
      ]);
      setEventData(evt);
      setOutcomeDeposits(deposits);
      const target = addr ?? address;
      if (target) {
        const [pred, bals] = await Promise.all([
          fetchUserPrediction(target),
          fetchBalances(target),
        ]);
        setPrediction(pred);
        setBalances(bals);
      }
    },
    [address],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) refreshChainData().catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [refreshChainData]);
  useEffect(() => {
    const id = setInterval(() => {
      refreshChainData().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refreshChainData]);

  const handleConnect = async () => {
    setConnectError("");
    try {
      const { signer: s, address: addr } = await connectWalletFn();
      setSigner(s);
      setAddress(addr);
      await refreshChainData(addr);
    } catch (e: unknown) {
      setConnectError(e instanceof Error ? e.message : "Connection failed");
    }
  };

  const handleApprove = async () => {
    if (!signer || !depositAmount || selectedOutcome === null) return;
    setIsApproving(true);
    setTxStatus("Approving token spend…");
    setTxHash(null);
    try {
      const amount = ethers.parseEther(depositAmount);
      const token0 = new ethers.Contract(ADDRESSES.token0, ERC20_ABI, signer);
      const token1 = new ethers.Contract(ADDRESSES.token1, ERC20_ABI, signer);
      const tx0 = await token0.approve(ADDRESSES.hook, amount);
      setTxHash(tx0.hash);
      setTxStatus("Approving ppUSDC…");
      await tx0.wait();
      const tx1 = await token1.approve(ADDRESSES.hook, amount);
      setTxHash(tx1.hash);
      setTxStatus("Approving ppWETH…");
      await tx1.wait();
      setIsApproved(true);
      setTxStatus("Both tokens approved! Ready to predict.");
    } catch (e: unknown) {
      setTxStatus(
        `Error: ${(e instanceof Error ? e.message : "Approval failed").slice(0, 80)}`,
      );
      setIsApproved(false);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePredict = async () => {
    if (!signer || !depositAmount || selectedOutcome === null) return;
    setIsPredicting(true);
    setTxStatus("Submitting prediction…");
    setTxHash(null);
    try {
      const contracts = getContracts(signer);
      const amount = ethers.parseEther(depositAmount);
      const tx = await contracts.hook.predict(
        EVENT_ID,
        selectedOutcome,
        amount,
        amount,
      );
      setTxHash(tx.hash);
      setTxStatus("Waiting for confirmation…");
      await tx.wait();
      setTxStatus("Prediction placed!");
      setIsApproved(false);
      setDepositAmount("");
      if (address) await refreshChainData(address);
    } catch (e: unknown) {
      setTxStatus(
        `Error: ${(e instanceof Error ? e.message : "Transaction failed").slice(0, 80)}`,
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleClaim = async () => {
    if (!signer) return;
    setIsClaiming(true);
    setClaimStatus("Claiming winnings…");
    try {
      const contracts = getContracts(signer);
      const tx = await contracts.hook.claim(EVENT_ID);
      setClaimStatus("Waiting for confirmation…");
      await tx.wait();
      setClaimStatus("Claimed! Check your wallet.");
      if (address) await refreshChainData(address);
    } catch (e: unknown) {
      setClaimStatus(
        `Error: ${(e instanceof Error ? e.message : "Claim failed").slice(0, 80)}`,
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const handleMint = async () => {
    if (!signer || !address) return;
    setIsMinting(true);
    setMintStatus("Minting tokens…");
    try {
      const contracts = getContracts(signer);
      const tx0 = await contracts.token0.mint(address, MINT_AMOUNT);
      setMintStatus("Minting ppUSDC…");
      await tx0.wait();
      const tx1 = await contracts.token1.mint(address, MINT_AMOUNT);
      setMintStatus("Minting ppWETH…");
      await tx1.wait();
      setMintStatus("Done! 1000 ppUSDC & ppWETH added.");
      await refreshChainData(address);
    } catch (e: unknown) {
      setMintStatus(
        `Error: ${(e instanceof Error ? e.message : "Mint failed").slice(0, 80)}`,
      );
    } finally {
      setIsMinting(false);
    }
  };

  // Runs a real swap through the deployed V4 router. This fires the hook's
  // afterSwap (swapCount++) and generates real LP fees — the "boost yield" demo.
  const handleBoost = async () => {
    if (!signer) return;
    setIsBoosting(true);
    setBoostStatus("Preparing swap…");
    setBoostTxHash(null);
    try {
      const owner = await signer.getAddress();
      const amount = ethers.parseEther("25");
      const token0 = new ethers.Contract(ADDRESSES.token0, ERC20_ABI, signer);
      const token1 = new ethers.Contract(ADDRESSES.token1, ERC20_ABI, signer);
      const [a0, a1] = await Promise.all([
        token0.allowance(owner, ADDRESSES.swapRouter),
        token1.allowance(owner, ADDRESSES.swapRouter),
      ]);
      if (a0 < amount) {
        setBoostStatus("Approving ppUSDC for swaps…");
        await (
          await token0.approve(ADDRESSES.swapRouter, ethers.MaxUint256)
        ).wait();
      }
      if (a1 < amount) {
        setBoostStatus("Approving ppWETH for swaps…");
        await (
          await token1.approve(ADDRESSES.swapRouter, ethers.MaxUint256)
        ).wait();
      }
      const router = new ethers.Contract(
        ADDRESSES.swapRouter,
        SWAP_ROUTER_ABI,
        signer,
      );
      const zeroForOne = (eventData?.swapCount ?? 0) % 2 === 0;
      const limit = zeroForOne ? SQRT_PRICE_LIMIT.min : SQRT_PRICE_LIMIT.max;
      setBoostStatus("Swapping through the pool…");
      const tx = await router.swap(
        [...POOL_KEY],
        [zeroForOne, -amount, limit],
        [false, false],
        "0x",
      );
      setBoostTxHash(tx.hash);
      setBoostStatus("Confirming on X Layer…");
      await tx.wait();
      setBoostStatus("Boosted! afterSwap fired — pool swap count +1.");
      await refreshChainData(address ?? undefined);
    } catch (e: unknown) {
      setBoostStatus(
        `Error: ${(e instanceof Error ? e.message : "Swap failed").slice(0, 80)}`,
      );
    } finally {
      setIsBoosting(false);
    }
  };

  const handleSelectOutcome = (i: number) => {
    setSelectedOutcome(i);
    setIsApproved(false);
    setTxStatus("");
    setTxHash(null);
  };

  const handleDepositChange = (v: string) => {
    setDepositAmount(v);
    setIsApproved(false);
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        connectError,
        eventData,
        outcomeDeposits,
        prediction,
        balances,
        selectedOutcome,
        depositAmount,
        isApproved,
        isApproving,
        isPredicting,
        isClaiming,
        isMinting,
        txStatus,
        txHash,
        claimStatus,
        mintStatus,
        handleConnect,
        handleApprove,
        handlePredict,
        handleClaim,
        handleMint,
        handleSelectOutcome,
        handleDepositChange,
        isBoosting,
        boostStatus,
        boostTxHash,
        handleBoost,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
