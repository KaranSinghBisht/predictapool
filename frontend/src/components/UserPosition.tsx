"use client";

import { ethers } from "ethers";
import { OUTCOMES } from "@/lib/contracts";
import type { UserPrediction, EventData } from "@/lib/web3";
import { FlagAR, FlagBR } from "@/components/icons";

interface UserPositionProps {
  prediction: UserPrediction;
  eventData: EventData | null;
  claimStatus: string;
  onClaim: () => void;
  isClaiming: boolean;
}

const OUTCOME_COLORS: Record<number, string> = { 0: "#75aadb", 1: "#94a3b8", 2: "#ffdf3a" };

function fmt(v: bigint) {
  return parseFloat(ethers.formatEther(v)).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function UserPosition({ prediction, eventData, claimStatus, onClaim, isClaiming }: UserPositionProps) {
  if (!prediction.exists) return null;

  const outcome = OUTCOMES[prediction.outcome];
  const color = OUTCOME_COLORS[prediction.outcome] ?? "#94a3b8";
  const isWinner = eventData?.resolved && prediction.outcome === eventData.winningOutcome;
  const canClaim = eventData?.settled && !prediction.claimed;

  return (
    <div className="relative overflow-hidden rounded-2xl p-[18px]" style={{ background: "linear-gradient(180deg, rgba(34,197,94,0.08), transparent)", border: `1px solid ${color}55` }}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-[radial-gradient(circle,rgba(34,197,94,0.3),transparent_70%)]" />

      <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mb-3">Active Position</div>

      <div className="flex items-center gap-3 mb-4">
        <div className="size-8 rounded-lg overflow-hidden">
          {prediction.outcome === 0 ? <FlagAR size={32} /> : prediction.outcome === 2 ? <FlagBR size={32} /> : <div className="size-8 rounded-lg" style={{ background: "linear-gradient(90deg,#75aadb 50%,#1aa84a 50%)" }} />}
        </div>
        <div>
          <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">ARG vs BRA · backing</div>
          <div className="font-display font-semibold text-base" style={{ color }}>{outcome?.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">Deposited</div>
          <div className="font-display font-semibold text-lg mt-0.5">{fmt(prediction.deposit0)}</div>
        </div>
        <div>
          <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">Status</div>
          <div className="font-display font-semibold text-[15px] mt-0.5" style={{ color }}>
            {prediction.claimed ? "Claimed" : isWinner ? "Winner" : "Earning"}
          </div>
        </div>
      </div>

      {canClaim && (
        <button
          onClick={onClaim} disabled={isClaiming}
          className="w-full mt-4 bg-[rgba(34,197,94,0.15)] text-[#86efac] border border-[rgba(34,197,94,0.5)] rounded-xl py-3 font-display font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isClaiming ? "Claiming…" : "Claim Winnings"}
        </button>
      )}
      {!canClaim && !prediction.claimed && (
        <button disabled className="w-full mt-4 bg-[rgba(34,197,94,0.15)] text-[#86efac] border border-[rgba(34,197,94,0.5)] rounded-xl py-3 font-display font-semibold text-sm opacity-70 cursor-not-allowed">
          Claim · Locked until settlement
        </button>
      )}
      {claimStatus && <p className="text-[10px] font-data text-[#6b7a8f] text-center mt-2">{claimStatus}</p>}
      <div className="text-center mt-2 font-data text-[11px] text-[#6b7a8f]">Principal returned regardless of outcome.</div>
    </div>
  );
}
