"use client";

import { useState } from "react";

type MarketStatus = "live" | "upcoming" | "settled";

interface MarketMatch {
  id: string;
  teamA: string;
  teamACode: string;
  teamAColor: string;
  teamB: string;
  teamBCode: string;
  teamBColor: string;
  poolSize: string;
  topOutcomePct: string;
  topOutcomeLabel: string;
  status: MarketStatus;
  timeRemaining: string;
  featured?: boolean;
}

const MARKETS: MarketMatch[] = [
  {
    id: "arg-bra",
    teamA: "Argentina",
    teamACode: "ARG",
    teamAColor: "#75aadb",
    teamB: "Brazil",
    teamBCode: "BRA",
    teamBColor: "#ffdf3a",
    poolSize: "$1.24M",
    topOutcomePct: "48.2%",
    topOutcomeLabel: "ARG",
    status: "live",
    timeRemaining: "2h 14m",
    featured: true,
  },
  {
    id: "ger-fra",
    teamA: "Germany",
    teamACode: "GER",
    teamAColor: "#d4d4d4",
    teamB: "France",
    teamBCode: "FRA",
    teamBColor: "#3b82f6",
    poolSize: "$812k",
    topOutcomePct: "52.1%",
    topOutcomeLabel: "FRA",
    status: "live",
    timeRemaining: "1h 38m",
  },
  {
    id: "eng-esp",
    teamA: "England",
    teamACode: "ENG",
    teamAColor: "#dc2626",
    teamB: "Spain",
    teamBCode: "ESP",
    teamBColor: "#fbbf24",
    poolSize: "$654k",
    topOutcomePct: "44.7%",
    topOutcomeLabel: "ESP",
    status: "live",
    timeRemaining: "45m",
  },
  {
    id: "usa-mex",
    teamA: "USA",
    teamACode: "USA",
    teamAColor: "#3b82f6",
    teamB: "Mexico",
    teamBCode: "MEX",
    teamBColor: "#16a34a",
    poolSize: "$1.08M",
    topOutcomePct: "51.3%",
    topOutcomeLabel: "USA",
    status: "upcoming",
    timeRemaining: "6h 20m",
  },
  {
    id: "por-ned",
    teamA: "Portugal",
    teamACode: "POR",
    teamAColor: "#dc2626",
    teamB: "Netherlands",
    teamBCode: "NED",
    teamBColor: "#f97316",
    poolSize: "$340k",
    topOutcomePct: "46.5%",
    topOutcomeLabel: "POR",
    status: "upcoming",
    timeRemaining: "1d 3h",
  },
  {
    id: "jpn-kor",
    teamA: "Japan",
    teamACode: "JPN",
    teamAColor: "#dc2626",
    teamB: "South Korea",
    teamBCode: "KOR",
    teamBColor: "#ef4444",
    poolSize: "$290k",
    topOutcomePct: "50.8%",
    topOutcomeLabel: "JPN",
    status: "upcoming",
    timeRemaining: "1d 8h",
  },
  {
    id: "ita-cro",
    teamA: "Italy",
    teamACode: "ITA",
    teamAColor: "#3b82f6",
    teamB: "Croatia",
    teamBCode: "CRO",
    teamBColor: "#dc2626",
    poolSize: "$410k",
    topOutcomePct: "57.3%",
    topOutcomeLabel: "ITA",
    status: "settled",
    timeRemaining: "Settled",
  },
  {
    id: "bel-sen",
    teamA: "Belgium",
    teamACode: "BEL",
    teamAColor: "#fbbf24",
    teamB: "Senegal",
    teamBCode: "SEN",
    teamBColor: "#16a34a",
    poolSize: "$185k",
    topOutcomePct: "61.2%",
    topOutcomeLabel: "BEL",
    status: "settled",
    timeRemaining: "Settled",
  },
  {
    id: "uru-can",
    teamA: "Uruguay",
    teamACode: "URU",
    teamAColor: "#60a5fa",
    teamB: "Canada",
    teamBCode: "CAN",
    teamBColor: "#dc2626",
    poolSize: "$220k",
    topOutcomePct: "53.6%",
    topOutcomeLabel: "URU",
    status: "upcoming",
    timeRemaining: "2d 1h",
  },
];

type FilterTab = "all" | "live" | "upcoming" | "settled";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Markets" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "settled", label: "Settled" },
];

function StatusBadge({ status }: { status: MarketStatus }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(34,197,94,0.14)] border border-[rgba(34,197,94,0.35)] rounded-full text-[10px] font-semibold text-[#6ee7a0] uppercase tracking-[0.08em]">
        <span
          className="size-1.5 rounded-full bg-[#22c55e] pulse-dot"
          style={{ boxShadow: "0 0 6px #22c55e" }}
        />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] rounded-full text-[10px] font-semibold text-[#38e0ff] uppercase tracking-[0.08em]">
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(107,122,143,0.12)] border border-[rgba(107,122,143,0.25)] rounded-full text-[10px] font-semibold text-[#6b7a8f] uppercase tracking-[0.08em]">
      Settled
    </span>
  );
}

function TeamDot({ color }: { color: string }) {
  return (
    <span
      className="size-[28px] rounded-full shrink-0"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}66)`,
        boxShadow: `0 0 10px ${color}33, inset 0 1px 2px rgba(255,255,255,0.2)`,
        border: `1px solid ${color}55`,
      }}
    />
  );
}

function MarketCard({ match }: { match: MarketMatch }) {
  const isFeatured = match.featured;
  const isLive = match.status === "live";
  const isSettled = match.status === "settled";

  return (
    <div
      className="group relative rounded-[20px] overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{
        background: isFeatured
          ? "linear-gradient(180deg, #0d1420 0%, #0a1019 100%)"
          : "#0a1019",
        border: isFeatured
          ? "1px solid rgba(0,212,255,0.35)"
          : "1px solid rgba(232,238,245,0.08)",
        boxShadow: isFeatured
          ? "0 0 40px -12px rgba(0,212,255,0.25), 0 0 0 1px rgba(0,212,255,0.1)"
          : "none",
        opacity: isSettled ? 0.7 : 1,
      }}
    >
      {/* Featured shimmer line */}
      {isFeatured && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          {isFeatured && (
            <span className="px-2 py-0.5 bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] rounded text-[9px] font-bold text-[#38e0ff] uppercase tracking-[0.1em]">
              Featured
            </span>
          )}
          <span className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
            #WC26
          </span>
        </div>
        <StatusBadge status={match.status} />
      </div>

      {/* Teams row */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3">
          <TeamDot color={match.teamAColor} />
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-[15px] text-[#e8eef5] truncate">
              {match.teamA}
            </div>
            <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.08em]">
              {match.teamACode}
            </div>
          </div>
          <span className="font-display font-bold text-sm text-[#6b7a8f] px-1">
            vs
          </span>
          <div className="flex-1 min-w-0 text-right">
            <div className="font-display font-semibold text-[15px] text-[#e8eef5] truncate">
              {match.teamB}
            </div>
            <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.08em]">
              {match.teamBCode}
            </div>
          </div>
          <TeamDot color={match.teamBColor} />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(232,238,245,0.06)] mx-5" />

      {/* Stats row */}
      <div className="grid grid-cols-3 px-5 py-3.5">
        <div>
          <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.08em]">
            Pool
          </div>
          <div className="font-data text-[14px] font-medium text-[#e8eef5] mt-0.5">
            {match.poolSize}
          </div>
        </div>
        <div className="text-center">
          <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.08em]">
            Top
          </div>
          <div className="font-data text-[14px] font-medium text-[#00d4ff] mt-0.5">
            {match.topOutcomePct}{" "}
            <span className="text-[10px] text-[#6b7a8f]">
              {match.topOutcomeLabel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.08em]">
            {isLive ? "Remaining" : isSettled ? "Status" : "Starts in"}
          </div>
          <div
            className="font-data text-[14px] font-medium mt-0.5"
            style={{
              color: isLive ? "#22c55e" : isSettled ? "#6b7a8f" : "#b6c2d4",
            }}
          >
            {match.timeRemaining}
          </div>
        </div>
      </div>

      {/* Hover border effect */}
      <div
        className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          boxShadow: isFeatured
            ? "inset 0 0 0 1px rgba(0,212,255,0.5)"
            : "inset 0 0 0 1px rgba(232,238,245,0.16)",
        }}
      />
    </div>
  );
}

export function MarketsSection() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all"
      ? MARKETS
      : MARKETS.filter((m) => m.status === activeTab);

  return (
    <section className="py-28 relative" id="markets">
      {/* Pitch-line pattern overlay */}
      <div className="absolute inset-0 pitch-pattern opacity-30 pointer-events-none" />

      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Section header */}
        <div className="mb-12">
          <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
            Browse Markets
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] font-bold tracking-[-0.03em] leading-[1.05] mt-4 text-[#e8eef5]">
            Markets
          </h2>
          <p className="text-[17px] text-[#b6c2d4] leading-[1.55] mt-3 max-w-[520px]">
            Preview of upcoming World Cup 2026 prediction pools — Argentina vs
            Brazil is live on testnet
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-10 p-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(232,238,245,0.08)] rounded-full w-fit overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const liveCount =
              tab.key === "live"
                ? MARKETS.filter((m) => m.status === "live").length
                : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="relative px-5 py-2.5 rounded-full font-data text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? "rgba(0,212,255,0.12)" : "transparent",
                  color: isActive ? "#38e0ff" : "#6b7a8f",
                  border: isActive
                    ? "1px solid rgba(0,212,255,0.3)"
                    : "1px solid transparent",
                }}
              >
                {tab.label}
                {liveCount !== null && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: isActive
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(107,122,143,0.15)",
                      color: isActive ? "#22c55e" : "#6b7a8f",
                    }}
                  >
                    {liveCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Markets grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((match) => (
            <MarketCard key={match.id} match={match} />
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-12 text-center">
          <span className="font-data text-xs text-[#6b7a8f] uppercase tracking-[0.12em]">
            {MARKETS.length} markets tracked &middot; Group stage &middot; World
            Cup 2026
          </span>
        </div>
      </div>
    </section>
  );
}
