"use client";

import { ethers } from "ethers";
import { explorerAddr } from "@/lib/contracts";
import { IconExternal } from "@/components/icons";

interface Balances {
  token0: bigint;
  token1: bigint;
  native: bigint;
}

interface WalletPanelProps {
  address: string;
  balances: Balances | null;
  mintStatus: string;
  onMint: () => void;
  isMinting: boolean;
}

function fmt(v: bigint) {
  return parseFloat(ethers.formatEther(v)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function BalRow({
  label,
  sub,
  value,
  iconClass,
}: {
  label: string;
  sub: string;
  value: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(232,238,245,0.08)] rounded-xl mb-2">
      <div className="flex items-center gap-2.5">
        <div
          className={`size-7 rounded-full flex items-center justify-center font-display font-bold text-[10px] ${iconClass}`}
        >
          $
        </div>
        <div>
          <div className="font-data text-[13px] font-medium text-[#e8eef5]">
            {label}
          </div>
          <div className="font-data text-[10px] text-[#6b7a8f]">{sub}</div>
        </div>
      </div>
      <div className="font-data text-sm font-medium text-[#e8eef5] text-right">
        {value}
      </div>
    </div>
  );
}

export function WalletPanel({
  address,
  balances,
  mintStatus,
  onMint,
  isMinting,
}: WalletPanelProps) {
  return (
    <div className="bg-gradient-to-b from-[#08111a] to-[#05080e] border border-[rgba(232,238,245,0.16)] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(232,238,245,0.08)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#00d4ff] via-[#16a34a] to-[#ffdf3a] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-data text-sm font-medium text-[#e8eef5] truncate">
              {address.slice(0, 6)}…{address.slice(-4)}
            </div>
            <div className="font-data text-[11px] text-[#6b7a8f]">
              X Layer Testnet
            </div>
          </div>
        </div>
        <a
          href={explorerAddr(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-data text-xs text-[#38e0ff] hover:underline"
        >
          View on Explorer <IconExternal />
        </a>
      </div>

      <div className="px-5 py-4">
        <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mb-3">
          Token Balances
        </div>
        {balances ? (
          <>
            <BalRow
              label="ppUSDC"
              sub="Test Stablecoin"
              value={fmt(balances.token0)}
              iconClass="bg-gradient-to-br from-[#00d4ff] to-[#0891b2] text-[#051018]"
            />
            <BalRow
              label="ppWETH"
              sub="Test Wrapped ETH"
              value={fmt(balances.token1)}
              iconClass="bg-gradient-to-br from-[#94a3b8] to-[#475569] text-white"
            />
            <BalRow
              label="OKB"
              sub="Gas · X Layer"
              value={fmt(balances.native)}
              iconClass="bg-gradient-to-br from-[#1a1a1a] to-[#404040] text-[#38e0ff] border border-[#0891b2]"
            />
          </>
        ) : (
          <>
            <BalRow
              label="ppUSDC"
              sub="Test Stablecoin"
              value="—"
              iconClass="bg-[#0f1825]"
            />
            <BalRow
              label="ppWETH"
              sub="Test Wrapped ETH"
              value="—"
              iconClass="bg-[#0f1825]"
            />
            <BalRow label="OKB" sub="Gas" value="—" iconClass="bg-[#0f1825]" />
          </>
        )}

        <button
          onClick={onMint}
          disabled={isMinting}
          className="w-full mt-2 bg-transparent text-[#38e0ff] border border-dashed border-[rgba(0,212,255,0.4)] rounded-xl py-3 font-data text-xs cursor-pointer hover:bg-[rgba(0,212,255,0.05)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isMinting ? "Minting…" : "+ Mint Demo Tokens (testnet faucet)"}
        </button>
        {mintStatus && (
          <p className="text-[10px] font-data text-[#6b7a8f] text-center mt-2">
            {mintStatus}
          </p>
        )}
      </div>
    </div>
  );
}
