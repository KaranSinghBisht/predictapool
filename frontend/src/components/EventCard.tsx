"use client";

import { ethers } from "ethers";
import { OUTCOMES, explorerTx } from "@/lib/contracts";
import type { EventData } from "@/lib/web3";
import { cn } from "@/lib/utils";
import { IconArrow } from "@/components/icons";
import { Flag } from "@/components/Flag";

interface EventCardProps {
  eventData: EventData | null;
  outcomeDeposits: bigint[];
  selectedOutcome: number | null;
  onSelectOutcome: (i: number) => void;
  depositAmount: string;
  onDepositChange: (v: string) => void;
  onApprove: () => void;
  onPredict: () => void;
  walletConnected: boolean;
  txStatus: string;
  txHash: string | null;
  isApproving: boolean;
  isPredicting: boolean;
  isApproved: boolean;
}

const OUTCOME_STYLES = [
  { color: "#75aadb", label: "Argentina to Win", sub: "Home pool", flag: "ar" },
  { color: "#94a3b8", label: "Match Draw", sub: "After 90 min", flag: "draw" },
  { color: "#ffdf3a", label: "Brazil to Win", sub: "Away pool", flag: "br" },
] as const;

function getStatus(evt: EventData) {
  if (evt.cancelled) return { label: "Cancelled", color: "#ef4444" };
  if (evt.settled) return { label: "Settled", color: "#22c55e" };
  if (evt.resolved) return { label: "Resolved", color: "#f59e0b" };
  return { label: "Live · Open", color: "#22c55e" };
}

function formatTimeLeft(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Closed";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function fmtPool(v: bigint): string {
  const n = parseFloat(ethers.formatEther(v));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function EmptyCard() {
  return (
    <div className="predict-card">
      <div className="px-6 py-5 border-b border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
        <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
          Loading match data…
        </span>
      </div>
      <div className="p-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[52px] rounded-[14px] border border-[rgba(232,238,245,0.08)] bg-[rgba(255,255,255,0.02)]"
          />
        ))}
      </div>
    </div>
  );
}

function OutcomeFlag({ flag }: { flag: string }) {
  if (flag === "ar") return <Flag code="ARG" size={24} square />;
  if (flag === "br") return <Flag code="BRA" size={24} square />;
  return (
    <div
      className="size-[26px] rounded-md"
      style={{
        background: "linear-gradient(90deg,#75aadb 50%,#1aa84a 50%)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    />
  );
}

export function EventCard({
  eventData,
  outcomeDeposits,
  selectedOutcome,
  onSelectOutcome,
  depositAmount,
  onDepositChange,
  onApprove,
  onPredict,
  walletConnected,
  txStatus,
  txHash,
  isApproving,
  isPredicting,
  isApproved,
}: EventCardProps) {
  if (!eventData) return <EmptyCard />;

  const status = getStatus(eventData);
  const totalDeposit = outcomeDeposits.reduce((a, b) => a + b, 0n);
  const isLive =
    !eventData.resolved && !eventData.settled && !eventData.cancelled;
  const isBusy = isApproving || isPredicting;
  const canAct =
    walletConnected && selectedOutcome !== null && !!depositAmount && !isBusy;

  const hasDeposits = totalDeposit > 0n;
  const pctNum = (i: number) =>
    hasDeposits ? (Number(outcomeDeposits[i]) / Number(totalDeposit)) * 100 : 0;
  const pctStr = (i: number) => pctNum(i).toFixed(1) + "%";
  const depStr = (i: number) => fmtPool(outcomeDeposits[i]);

  return (
    <div className="predict-card">
      {/* Ticket header */}
      <div className="px-6 py-4 border-b border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] flex items-center justify-between">
        <div className="flex items-center gap-3 font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
          <span>Match · #WC26</span>
          <span className="opacity-50">·</span>
          <span>Group Stage</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(34,197,94,0.16)] border border-[rgba(34,197,94,0.4)] rounded-full text-[10px] font-semibold text-[#6ee7a0] uppercase tracking-[0.1em]">
          <span
            className="size-1.5 rounded-full bg-[#22c55e] pulse-dot"
            style={{ boxShadow: "0 0 8px #22c55e" }}
          />
          {status.label}
        </div>
      </div>

      {/* Match banner */}
      <div className="px-6 pt-7 pb-6">
        <div className="grid grid-cols-[1fr_60px_1fr] items-center">
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="size-16 rounded-[18px] overflow-hidden flex items-center justify-center"
              style={{ boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)" }}
            >
              <Flag code="ARG" size={64} square />
            </div>
            <span className="font-display font-semibold text-lg">
              Argentina
            </span>
            <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
              ARG
            </span>
          </div>
          <span className="font-display font-bold text-2xl text-[#6b7a8f] text-center">
            VS
          </span>
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="size-16 rounded-[18px] overflow-hidden flex items-center justify-center"
              style={{ boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)" }}
            >
              <Flag code="BRA" size={64} square />
            </div>
            <span className="font-display font-semibold text-lg">Brazil</span>
            <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
              BRA
            </span>
          </div>
        </div>

        {/* Meta stats */}
        <div className="mt-5 grid grid-cols-3 bg-[rgba(0,0,0,0.25)] border border-[rgba(232,238,245,0.08)] rounded-xl overflow-hidden">
          {[
            {
              k: "Time Left",
              v: !isLive ? "Ended" : formatTimeLeft(eventData.deadline),
            },
            {
              k: "Total Pool",
              v: fmtPool(eventData.totalDeposit0),
            },
            {
              k: "Swaps",
              v: eventData.swapCount.toLocaleString(),
            },
          ].map((m, i) => (
            <div
              key={m.k}
              className={cn(
                "px-3.5 py-3",
                i > 0 && "border-l border-[rgba(232,238,245,0.08)]",
              )}
            >
              <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                {m.k}
              </div>
              <div className="font-data text-[15px] font-medium text-[#e8eef5] mt-1">
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hook-driven dynamic fee — the v2 hook prices every swap from event state */}
      {isLive && eventData.feePips > 0 && (
        <div
          className="mx-6 mb-1 flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{
            background: "rgba(0,212,255,0.06)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          <span className="font-data text-[11px] text-[#38e0ff] uppercase tracking-[0.1em]">
            ⚡ Hook-driven fee
          </span>
          <span className="font-data text-[13px] text-[#e8eef5]">
            {(eventData.feePips / 10000).toFixed(2)}%
            <span className="text-[#6b7a8f]"> · ramps to 1.00% at kickoff</span>
          </span>
        </div>
      )}

      {/* Outcomes */}
      <div className="px-6 pb-1 space-y-2.5">
        {OUTCOME_STYLES.map((o, i) => {
          const sel = selectedOutcome === i;
          const canSelect = isLive && walletConnected;
          const pct = pctNum(i);
          return (
            <button
              key={i}
              onClick={() => canSelect && onSelectOutcome(i)}
              disabled={!canSelect}
              className={cn(
                "outcome-btn w-full text-left",
                sel && "active",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <div
                className="absolute top-0 left-0 bottom-0 pointer-events-none opacity-[0.16] transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${o.color}99, transparent)`,
                  borderRadius: 14,
                }}
              />
              <div className="relative z-[1] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OutcomeFlag flag={o.flag} />
                  <div>
                    <div className="font-display font-medium text-[15px] text-[#e8eef5]">
                      {o.label}
                    </div>
                    <div className="font-data text-[11px] text-[#6b7a8f] mt-0.5">
                      {depStr(i)} deposited
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-data text-lg font-semibold"
                    style={{ color: o.color }}
                  >
                    {pctStr(i)}
                  </div>
                  <div className="font-data text-[11px] text-[#6b7a8f]">
                    share of pool
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Deposit area */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex justify-between font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em] mb-2">
          <span>Your deposit (equal ppUSDC + ppWETH)</span>
          {walletConnected && <span>per token</span>}
        </div>
        <div className="flex items-center bg-[rgba(0,0,0,0.4)] border border-[rgba(232,238,245,0.16)] rounded-[14px] px-4 py-3.5 focus-within:border-[#00d4ff] focus-within:shadow-[0_0_0_3px_rgba(0,212,255,0.12)] transition-all">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => onDepositChange(e.target.value)}
            disabled={!isLive || !walletConnected || isBusy}
            className="bg-transparent border-0 outline-none font-display font-semibold text-xl sm:text-[26px] text-[#e8eef5] flex-1 w-full tracking-[-0.02em] placeholder:text-[rgba(232,238,245,0.2)]"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 pl-2 bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.3)] rounded-full font-data font-medium text-[13px] text-[#e8eef5] shrink-0">
            <div className="size-[22px] rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0891b2] flex items-center justify-center font-display font-bold text-[11px] text-[#051018]">
              $
            </div>
            ppUSDC
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {["50", "100", "250", "500"].map((q) => (
            <button
              key={q}
              onClick={() => onDepositChange(q.replace(",", ""))}
              disabled={!isLive || !walletConnected || isBusy}
              className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(232,238,245,0.08)] text-[#b6c2d4] py-2 rounded-lg font-data text-xs cursor-pointer hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(232,238,245,0.16)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Action button */}
        <button
          disabled={!walletConnected ? true : !canAct}
          className={cn(
            "w-full mt-4 py-4.5 rounded-[14px] font-display font-semibold text-base tracking-[-0.01em] flex items-center justify-center gap-2.5 transition-all cursor-pointer",
            "disabled:bg-[rgba(255,255,255,0.06)] disabled:text-[#6b7a8f] disabled:cursor-not-allowed disabled:shadow-none",
            !walletConnected
              ? "bg-[rgba(255,255,255,0.06)] text-[#6b7a8f]"
              : isApproved
                ? "btn-cyan"
                : "bg-[rgba(34,197,94,0.16)] text-[#86efac] shadow-[inset_0_0_0_1px_rgba(34,197,94,0.5)]",
          )}
          onClick={isApproved ? onPredict : onApprove}
        >
          {!walletConnected ? (
            "Connect Wallet to Predict"
          ) : isApproving ? (
            "Approving…"
          ) : isPredicting ? (
            "Submitting prediction…"
          ) : isApproved ? (
            <>
              {`Predict · Deposit ${depositAmount || "0"} ppUSDC`}{" "}
              <IconArrow size={14} />
            </>
          ) : (
            "Approve ppUSDC"
          )}
        </button>
      </div>

      {/* Footer strip */}
      <div className="border-t border-dashed border-[rgba(255,255,255,0.08)] px-6 py-3.5 flex justify-between bg-[rgba(0,0,0,0.2)]">
        <span className="font-data text-xs text-[#6b7a8f]">
          Principal-targeted ·{" "}
          <span className="text-[#e8eef5]">IL-exposed on volatile pairs</span>
        </span>
        {eventData.resolved && (
          <span
            className="font-data text-xs font-semibold"
            style={{ color: OUTCOME_STYLES[eventData.winningOutcome]?.color }}
          >
            Winner: {OUTCOMES[eventData.winningOutcome]?.label}
          </span>
        )}
      </div>

      {txStatus && (
        <div className="px-6 pb-4">
          <div className="rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(232,238,245,0.08)] px-4 py-3">
            <p className="text-xs font-data text-[#b6c2d4]">{txStatus}</p>
            {txHash && (
              <a
                href={explorerTx(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-data text-[#00d4ff] hover:underline mt-1 block"
              >
                View on Explorer &rarr;
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
