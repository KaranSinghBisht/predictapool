"use client";

import { use } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Context";
import { getMarketById } from "@/lib/markets";
import { explorerTx } from "@/lib/contracts";
import { ProofPanel } from "@/components/ProofPanel";
import { EventCard } from "@/components/EventCard";
import { WalletPanel } from "@/components/WalletPanel";
import { UserPosition } from "@/components/UserPosition";
import { FlagAR, FlagBR, IconArrow } from "@/components/icons";

function fmtEth(v: bigint): string {
  const n = parseFloat(ethers.formatEther(v));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatTimeLeft(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Closed";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[rgba(0,0,0,0.25)] border border-[rgba(232,238,245,0.08)] rounded-2xl p-5">
      <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
        {label}
      </div>
      <div
        className={`font-display text-[28px] font-bold tracking-[-0.02em] leading-none mt-2 ${accent ? "text-[#22c55e]" : "text-[#e8eef5]"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const market = getMarketById(id);
  const ctx = useWeb3();

  if (!market) {
    return (
      <div className="py-32 text-center">
        <h1 className="font-display text-3xl font-bold text-[#e8eef5] mb-4">
          Market not found
        </h1>
        <Link
          href="/markets"
          className="text-[#00d4ff] font-data text-sm hover:underline"
        >
          &larr; Back to Markets
        </Link>
      </div>
    );
  }

  const isReal = market.isReal;
  const totalDeposit = ctx.outcomeDeposits.reduce((a, b) => a + b, 0n);
  // When the live pool is empty, fall back to demo figures so the featured
  // market looks populated. Real percentages take over the moment funds arrive.
  const hasLiveDeposits = totalDeposit > 0n;
  const pctNum = (i: number) =>
    !hasLiveDeposits
      ? 0
      : (Number(ctx.outcomeDeposits[i]) / Number(totalDeposit)) * 100;

  const realPool = ctx.eventData?.totalDeposit0 ?? 0n;
  const realSwaps = ctx.eventData?.swapCount ?? 0;

  const outcomes = [
    {
      label: `${market.teamA} Win`,
      color: market.teamAColor,
      pct: isReal ? pctNum(0) : 0,
    },
    { label: "Draw", color: "#94a3b8", pct: isReal ? pctNum(1) : 0 },
    {
      label: `${market.teamB} Win`,
      color: market.teamBColor,
      pct: isReal ? pctNum(2) : 0,
    },
  ];

  return (
    <section
      className="py-12 min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #05080e 0%, #06140d 50%, #05080e 100%)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Breadcrumb */}
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 font-data text-sm text-[#6b7a8f] hover:text-[#38e0ff] transition-colors mb-8"
        >
          &larr; All Markets
        </Link>

        {/* Match Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-3">
                {market.id === "arg-bra" ? (
                  <div className="size-12 rounded-2xl overflow-hidden">
                    <FlagAR size={48} />
                  </div>
                ) : (
                  <div
                    className="size-12 rounded-2xl"
                    style={{ background: market.teamAColor }}
                  />
                )}
                <span className="font-display text-2xl font-bold text-[#e8eef5]">
                  {market.teamA}
                </span>
              </div>
              <span className="font-display text-xl font-bold text-[#6b7a8f]">
                VS
              </span>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-[#e8eef5]">
                  {market.teamB}
                </span>
                {market.id === "arg-bra" ? (
                  <div className="size-12 rounded-2xl overflow-hidden">
                    <FlagBR size={48} />
                  </div>
                ) : (
                  <div
                    className="size-12 rounded-2xl"
                    style={{ background: market.teamBColor }}
                  />
                )}
              </div>
            </div>
            <div className="font-data text-sm text-[#6b7a8f]">
              {market.group} &middot; {market.kickoff} &middot; {market.venue}
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              market.status === "live"
                ? "bg-[rgba(34,197,94,0.14)] text-[#6ee7a0] border border-[rgba(34,197,94,0.4)]"
                : market.status === "upcoming"
                  ? "bg-[rgba(0,212,255,0.08)] text-[#38e0ff] border border-[rgba(0,212,255,0.2)]"
                  : "bg-[rgba(107,122,143,0.1)] text-[#6b7a8f] border border-[rgba(107,122,143,0.2)]"
            }`}
          >
            {market.status === "live" && (
              <span
                className="size-2 rounded-full bg-[#22c55e] pulse-dot"
                style={{ boxShadow: "0 0 6px #22c55e" }}
              />
            )}
            {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatBox
            label="Total Pool"
            value={isReal ? fmtEth(realPool) : market.poolSize}
          />
          <StatBox
            label="Swap Count"
            value={isReal ? realSwaps.toLocaleString() : "—"}
          />
          <StatBox
            label="Time Remaining"
            value={
              isReal && ctx.eventData
                ? formatTimeLeft(ctx.eventData.deadline)
                : market.timeRemaining
            }
          />
          <StatBox label="Network" value="X Layer · 1952" />
        </div>

        {/* Outcome Distribution — only when the live pool has real deposits */}
        {isReal && hasLiveDeposits && (
          <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] p-6 mb-10">
            <h3 className="font-display font-semibold text-base text-[#e8eef5] mb-5">
              Market Odds (Implied from Pool)
            </h3>
            <div className="space-y-4">
              {outcomes.map((o) => (
                <div key={o.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-data text-sm text-[#e8eef5]">
                      {o.label}
                    </span>
                    <span
                      className="font-data text-sm font-semibold"
                      style={{ color: o.color }}
                    >
                      {o.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${o.pct}%`,
                        background: `linear-gradient(90deg, ${o.color}, ${o.color}88)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content: Prediction Card + Sidebar */}
        {isReal ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="space-y-6">
              <EventCard
                eventData={ctx.eventData}
                outcomeDeposits={ctx.outcomeDeposits}
                selectedOutcome={ctx.selectedOutcome}
                onSelectOutcome={ctx.handleSelectOutcome}
                depositAmount={ctx.depositAmount}
                onDepositChange={ctx.handleDepositChange}
                onApprove={ctx.handleApprove}
                onPredict={ctx.handlePredict}
                walletConnected={!!ctx.address}
                txStatus={ctx.txStatus}
                txHash={ctx.txHash}
                isApproving={ctx.isApproving}
                isPredicting={ctx.isPredicting}
                isApproved={ctx.isApproved}
              />

              {/* Boost the pool — fire a real swap, watch the count tick up */}
              <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-base text-[#e8eef5]">
                    Boost the pool
                  </h3>
                  <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                    {(ctx.eventData?.swapCount ?? 0).toLocaleString()} swaps
                  </span>
                </div>
                <p className="text-sm text-[#b6c2d4] leading-relaxed mb-4">
                  Every trade routes through the hook&apos;s{" "}
                  <span className="font-data text-[#38e0ff]">afterSwap</span>{" "}
                  callback and adds real LP fees to the pool&apos;s yield. Run
                  one live and watch the on-chain swap count tick up.
                </p>
                <button
                  onClick={ctx.handleBoost}
                  disabled={!ctx.address || ctx.isBoosting}
                  className="btn-cyan w-full py-3.5 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!ctx.address
                    ? "Connect wallet to boost"
                    : ctx.isBoosting
                      ? "Swapping…"
                      : "Run a live swap →"}
                </button>
                {ctx.boostStatus && (
                  <div className="mt-3 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(232,238,245,0.08)] px-4 py-3">
                    <p className="text-xs font-data text-[#b6c2d4]">
                      {ctx.boostStatus}
                    </p>
                    {ctx.boostTxHash && (
                      <a
                        href={explorerTx(ctx.boostTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-data text-[#00d4ff] hover:underline mt-1 block"
                      >
                        View swap on Explorer &rarr;
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* On-chain proof — real, verifiable lifecycle */}
              <ProofPanel pool={fmtEth(realPool)} swaps={realSwaps} />
            </div>

            {ctx.address && (
              <div className="space-y-4">
                <WalletPanel
                  address={ctx.address}
                  balances={ctx.balances}
                  mintStatus={ctx.mintStatus}
                  onMint={ctx.handleMint}
                  isMinting={ctx.isMinting}
                />
                {ctx.prediction?.exists && (
                  <UserPosition
                    prediction={ctx.prediction}
                    eventData={ctx.eventData}
                    claimStatus={ctx.claimStatus}
                    onClaim={ctx.handleClaim}
                    isClaiming={ctx.isClaiming}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] p-12 text-center">
            <div className="size-16 rounded-full bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mx-auto mb-5">
              <IconArrow size={24} />
            </div>
            <h3 className="font-display text-xl font-semibold text-[#e8eef5] mb-2">
              Deposits Opening Soon
            </h3>
            <p className="font-data text-sm text-[#6b7a8f] max-w-md mx-auto mb-6">
              This market is being prepared. Once the pool is deployed on X
              Layer, you&apos;ll be able to deposit and predict here.
            </p>
            <Link
              href="/markets/arg-bra"
              className="btn-cyan inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
            >
              Try the Live Market <IconArrow size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
