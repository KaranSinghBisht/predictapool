"use client";

import { ethers } from "ethers";
import type { UserPrediction, EventData } from "@/lib/web3";

interface DashboardProps {
  address: string | null;
  prediction: UserPrediction | null;
  eventData: EventData | null;
  balances: { token0: bigint; token1: bigint; native: bigint } | null;
}

const OUTCOME_META: { label: string; code: string; color: string }[] = [
  { label: "Argentina Win", code: "ARG", color: "#75aadb" },
  { label: "Draw", code: "DRAW", color: "#94a3b8" },
  { label: "Brazil Win", code: "BRA", color: "#ffdf3a" },
];

const CHAINS: {
  name: string;
  active: boolean;
  color: string;
  icon: string;
}[] = [
  { name: "X Layer", active: true, color: "#00d4ff", icon: "X" },
  { name: "Ethereum", active: false, color: "#627eea", icon: "E" },
  { name: "Base", active: false, color: "#3b82f6", icon: "B" },
  { name: "Arbitrum", active: false, color: "#28a0f0", icon: "A" },
];

function fmtShort(val: bigint): string {
  const n = parseFloat(ethers.formatEther(val));
  return n.toFixed(2);
}

function computeYield(
  prediction: UserPrediction,
  eventData: EventData,
): string {
  if (!prediction.exists) return "$0.00";
  const deposit = parseFloat(ethers.formatEther(prediction.deposit0));
  const totalDeposit = parseFloat(ethers.formatEther(eventData.totalDeposit0));
  if (totalDeposit === 0) return "$0.00";
  const totalReturn = parseFloat(ethers.formatEther(eventData.totalReturn0));
  const share = deposit / totalDeposit;
  const yieldAmt = (totalReturn - totalDeposit) * share;
  if (yieldAmt <= 0) return "0.00";
  return yieldAmt.toFixed(2);
}

function computePortfolioValue(
  prediction: UserPrediction | null,
  balances: { token0: bigint; token1: bigint; native: bigint } | null,
): string {
  let total = 0;
  if (balances) {
    total += parseFloat(ethers.formatEther(balances.token0));
    total += parseFloat(ethers.formatEther(balances.token1));
  }
  if (prediction?.exists) {
    total += parseFloat(ethers.formatEther(prediction.deposit0));
    total += parseFloat(ethers.formatEther(prediction.deposit1));
  }
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(2)}M`;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`;
  return total.toFixed(2);
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[16px] px-5 py-5">
      <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
        {label}
      </div>
      <div
        className="font-display text-[32px] font-bold tracking-[-0.03em] leading-none mt-2"
        style={{ color: accent ?? "#e8eef5" }}
      >
        {value}
      </div>
      {sub && (
        <div className="font-data text-[11px] text-[#6b7a8f] mt-2">{sub}</div>
      )}
    </div>
  );
}

function DisconnectedState() {
  return (
    <section className="py-28" id="dashboard">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        <div className="flex flex-col items-center justify-center py-20 bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[24px]">
          <div
            className="size-14 rounded-full flex items-center justify-center mb-5"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 16 16"
              fill="none"
              className="text-[#38e0ff]"
            >
              <rect
                x="1.5"
                y="3.5"
                width="13"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="11.5" cy="8" r="0.8" fill="currentColor" />
              <path
                d="M1.5 5.5 H11 V3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-[#e8eef5] mb-2">
            Connect wallet to view dashboard
          </h3>
          <p className="font-data text-sm text-[#6b7a8f] max-w-[340px] text-center">
            Link your wallet to see your portfolio, active positions, and
            accrued yield across all markets.
          </p>
        </div>
      </div>
    </section>
  );
}

function PositionRow({
  prediction,
  eventData,
}: {
  prediction: UserPrediction;
  eventData: EventData;
}) {
  const outcome = OUTCOME_META[prediction.outcome] ?? OUTCOME_META[0];
  const isSettled = eventData.settled;
  const yieldStr = computeYield(prediction, eventData);

  return (
    <div className="grid grid-cols-[1fr_120px_100px_100px_100px] min-w-[600px] items-center px-5 py-4 border-b border-[rgba(232,238,245,0.06)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <div className="flex items-center gap-3">
        <span
          className="size-[10px] rounded-full shrink-0"
          style={{ background: outcome.color }}
        />
        <div>
          <span className="font-display text-sm font-medium text-[#e8eef5]">
            {outcome.label}
          </span>
          <span className="font-data text-[10px] text-[#6b7a8f] ml-2 uppercase">
            {outcome.code}
          </span>
        </div>
      </div>
      <div className="font-data text-sm text-[#e8eef5]">
        {fmtShort(prediction.deposit0)}{" "}
        <span className="text-[10px] text-[#6b7a8f]">ppUSDC</span>
      </div>
      <div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em]"
          style={{
            background: isSettled
              ? "rgba(107,122,143,0.12)"
              : "rgba(34,197,94,0.14)",
            color: isSettled ? "#6b7a8f" : "#6ee7a0",
            border: isSettled
              ? "1px solid rgba(107,122,143,0.25)"
              : "1px solid rgba(34,197,94,0.35)",
          }}
        >
          {!isSettled && (
            <span
              className="size-1.5 rounded-full bg-[#22c55e] pulse-dot"
              style={{ boxShadow: "0 0 4px #22c55e" }}
            />
          )}
          {isSettled ? "Settled" : "Earning"}
        </span>
      </div>
      <div className="font-data text-sm text-[#22c55e]">{yieldStr}</div>
      <div className="text-right">
        {prediction.claimed ? (
          <span className="font-data text-[10px] text-[#6b7a8f] uppercase">
            Claimed
          </span>
        ) : (
          <span className="font-data text-[10px] text-[#38e0ff] uppercase">
            Active
          </span>
        )}
      </div>
    </div>
  );
}

export function Dashboard({
  address,
  prediction,
  eventData,
  balances,
}: DashboardProps) {
  if (!address) return <DisconnectedState />;

  const portfolioValue = computePortfolioValue(prediction, balances);
  const activePositions = prediction?.exists ? 1 : 0;
  const yieldEarned =
    prediction?.exists && eventData
      ? computeYield(prediction, eventData)
      : "$0.00";
  const result = !prediction?.exists
    ? "—"
    : !eventData?.settled
      ? "Pending"
      : prediction.outcome === eventData.winningOutcome
        ? "Won"
        : "Lost";

  return (
    <section className="py-28 relative" id="dashboard">
      {/* Subtle radial background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(0,212,255,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Section header */}
        <div className="mb-12">
          <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
            Portfolio
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] font-bold tracking-[-0.03em] leading-[1.05] mt-4 text-[#e8eef5]">
            Dashboard
          </h2>
          <p className="text-[17px] text-[#b6c2d4] leading-[1.55] mt-3 max-w-[480px]">
            Track your positions, yield, and performance across prediction
            markets.
          </p>
          <p className="font-data text-xs text-[#6b7a8f] mt-2.5">
            Balances are X Layer testnet mock tokens (ppUSDC / ppWETH) — no real
            value.
          </p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Holdings · test tokens"
            value={portfolioValue}
            sub={
              balances
                ? `${parseFloat(ethers.formatEther(balances.token0)).toFixed(0)} ppUSDC in wallet`
                : "No wallet data"
            }
          />
          <StatCard
            label="Active Positions"
            value={String(activePositions)}
            sub={activePositions > 0 ? "Argentina vs Brazil" : "No active bets"}
          />
          <StatCard
            label="Yield Earned"
            value={yieldEarned}
            sub="ppUSDC · from swap fees"
            accent="#22c55e"
          />
          <StatCard
            label="Result"
            value={result}
            sub={
              prediction?.exists
                ? eventData?.settled
                  ? "Event settled on-chain"
                  : "Settles after the match"
                : "Place a prediction to begin"
            }
          />
        </div>

        {/* Active positions */}
        <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] overflow-hidden mb-10">
          <div className="px-5 py-4 border-b border-[rgba(232,238,245,0.08)] bg-[rgba(0,0,0,0.2)]">
            <h3 className="font-display text-base font-semibold text-[#e8eef5]">
              Active Positions
            </h3>
          </div>

          <div className="overflow-x-auto">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_120px_100px_100px_100px] min-w-[600px] px-5 py-3 border-b border-[rgba(232,238,245,0.08)]">
              {["Team / Outcome", "Deposit", "Status", "Yield", ""].map(
                (col) => (
                  <div
                    key={col}
                    className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]"
                    style={{ textAlign: col === "" ? "right" : "left" }}
                  >
                    {col}
                  </div>
                ),
              )}
            </div>

            {/* Rows */}
            {prediction?.exists && eventData ? (
              <PositionRow prediction={prediction} eventData={eventData} />
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="font-data text-sm text-[#6b7a8f]">
                  No active positions. Place a prediction to see it here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Supported chains */}
        <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(232,238,245,0.08)] bg-[rgba(0,0,0,0.2)]">
            <h3 className="font-display text-base font-semibold text-[#e8eef5]">
              Supported Chains
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            {CHAINS.map((chain) => (
              <div
                key={chain.name}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] transition-colors"
                style={{
                  background: chain.active
                    ? "rgba(0,212,255,0.06)"
                    : "rgba(255,255,255,0.02)",
                  border: chain.active
                    ? "1px solid rgba(0,212,255,0.2)"
                    : "1px solid rgba(232,238,245,0.06)",
                  opacity: chain.active ? 1 : 0.45,
                }}
              >
                <div
                  className="size-8 rounded-lg flex items-center justify-center font-display font-bold text-xs"
                  style={{
                    background: chain.active
                      ? `${chain.color}20`
                      : "rgba(107,122,143,0.12)",
                    color: chain.active ? chain.color : "#6b7a8f",
                    border: `1px solid ${chain.active ? `${chain.color}40` : "rgba(107,122,143,0.15)"}`,
                  }}
                >
                  {chain.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-medium text-[#e8eef5] truncate">
                    {chain.name}
                  </div>
                  <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.06em] flex items-center gap-1.5">
                    {chain.active ? (
                      <>
                        <span
                          className="size-1.5 rounded-full bg-[#22c55e] pulse-dot"
                          style={{ boxShadow: "0 0 4px #22c55e" }}
                        />
                        Connected
                      </>
                    ) : (
                      "Coming soon"
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
