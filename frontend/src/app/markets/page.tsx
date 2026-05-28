"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETS, type MarketMatch, type MarketStatus } from "@/lib/markets";
import { Flag } from "@/components/Flag";

type FilterTab = "all" | "live" | "upcoming" | "settled";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Markets" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "settled", label: "Settled" },
];

function getBackgroundImage(match: MarketMatch): string {
  if (match.id === "arg-bra") return "/images/match-arg.png";
  if (match.teamACode === "BRA" || match.teamBCode === "BRA")
    return "/images/match-bra.png";
  return "/images/match-generic.png";
}

function StatusBadge({ status }: { status: MarketStatus }) {
  if (status === "live") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{
          background: "rgba(34,197,94,0.14)",
          border: "1px solid rgba(34,197,94,0.35)",
          color: "#6ee7a0",
        }}
      >
        <span
          className="size-1.5 rounded-full pulse-dot"
          style={{
            background: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
          }}
        />
        Live
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{
          background: "rgba(0,212,255,0.1)",
          border: "1px solid rgba(0,212,255,0.3)",
          color: "#38e0ff",
        }}
      >
        Upcoming
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{
        background: "rgba(107,122,143,0.12)",
        border: "1px solid rgba(107,122,143,0.25)",
        color: "#6b7a8f",
      }}
    >
      Settled
    </span>
  );
}

const DELAY_CLASSES = ["", "delay-100", "delay-200", "delay-300", "delay-400"];

function MarketCard({ match, index }: { match: MarketMatch; index: number }) {
  const isFeatured = match.featured;
  const isSettled = match.status === "settled";
  const isLive = match.status === "live";
  const bg = getBackgroundImage(match);

  return (
    <Link
      href={`/markets/${match.id}`}
      className={`group animate-fade-in-up ${DELAY_CLASSES[index % DELAY_CLASSES.length]} relative block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
      style={{
        border: isFeatured
          ? "1px solid rgba(0,212,255,0.45)"
          : "1px solid rgba(232,238,245,0.1)",
        boxShadow: isFeatured
          ? "0 0 50px -10px rgba(0,212,255,0.3), 0 0 0 1px rgba(0,212,255,0.12)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        opacity: isSettled ? 0.65 : 1,
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,10,18,0.5) 0%, rgba(6,10,18,0.78) 45%, rgba(6,10,18,0.93) 100%)",
        }}
      />

      {/* Featured top glow line */}
      {isFeatured && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.7) 50%, transparent 100%)",
          }}
        />
      )}

      {/* Card content */}
      <div className="relative z-10 p-5">
        {/* Top badges row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isFeatured && (
              <span
                className="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{
                  background: "rgba(0,212,255,0.15)",
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "#38e0ff",
                }}
              >
                Live On-Chain
              </span>
            )}
            {match.group && (
              <span
                className="text-[10px] font-medium uppercase tracking-[0.1em]"
                style={{ color: "#6b7a8f" }}
              >
                {match.group}
              </span>
            )}
          </div>
          <StatusBadge status={match.status} />
        </div>

        {/* Teams display */}
        <div className="flex items-center gap-3 mb-4">
          <Flag code={match.teamACode} size={34} square className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-[15px] truncate"
              style={{ color: "#e8eef5" }}
            >
              {match.teamA}
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.08em]"
              style={{ color: "#6b7a8f" }}
            >
              {match.teamACode}
            </div>
          </div>
          <span
            className="font-bold text-xs px-2 py-0.5 rounded-full"
            style={{
              color: "#4a5568",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            VS
          </span>
          <div className="flex-1 min-w-0 text-right">
            <div
              className="font-bold text-[15px] truncate"
              style={{ color: "#e8eef5" }}
            >
              {match.teamB}
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.08em]"
              style={{ color: "#6b7a8f" }}
            >
              {match.teamBCode}
            </div>
          </div>
          <Flag code={match.teamBCode} size={34} square className="shrink-0" />
        </div>

        {/* Venue info */}
        {match.venue && (
          <div className="text-[11px] mb-4" style={{ color: "#6b7a8f" }}>
            {match.venue}
            {match.kickoff && (
              <span style={{ color: "#4a5568" }}>
                {" "}
                &middot; {match.kickoff}
              </span>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#6b7a8f" }}
              >
                Pool
              </div>
              <div
                className="text-sm font-semibold mt-0.5"
                style={{ color: "#e8eef5" }}
              >
                {match.poolSize}
              </div>
            </div>
            <div className="text-center">
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#6b7a8f" }}
              >
                Top Pick
              </div>
              <div
                className="text-sm font-semibold mt-0.5"
                style={{ color: "#00d4ff" }}
              >
                {match.topOutcomePct}{" "}
                <span style={{ color: "#6b7a8f", fontSize: "10px" }}>
                  {match.topOutcomeLabel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#6b7a8f" }}
              >
                {isLive ? "Remaining" : isSettled ? "Status" : "Starts in"}
              </div>
              <div
                className="text-sm font-semibold mt-0.5"
                style={{
                  color: isLive ? "#22c55e" : isSettled ? "#6b7a8f" : "#b6c2d4",
                }}
              >
                {match.timeRemaining}
              </div>
            </div>
          </div>
        </div>

        {/* On-chain CTA for real markets, preview note otherwise */}
        {match.isReal ? (
          <div
            className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "#00d4ff" }}
          >
            Click to predict &middot; Live on X Layer testnet
          </div>
        ) : (
          <div
            className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "#6b7a8f" }}
          >
            Preview &middot; opens on-chain soon
          </div>
        )}
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: isFeatured
            ? "inset 0 0 0 1px rgba(0,212,255,0.55)"
            : "inset 0 0 0 1px rgba(232,238,245,0.2)",
        }}
      />
    </Link>
  );
}

export default function MarketsPage() {
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered =
    tab === "all" ? MARKETS : MARKETS.filter((m) => m.status === tab);

  const liveCount = MARKETS.filter((m) => m.status === "live").length;

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Page header */}
        <div className="mb-12">
          <span
            className="text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#38e0ff" }}
          >
            FIFA World Cup 2026
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-[56px] font-bold tracking-tight leading-[1.0] mt-4"
            style={{ color: "#e8eef5" }}
          >
            All Markets
          </h1>
          <p
            className="text-lg leading-relaxed mt-3 max-w-[560px]"
            style={{ color: "#b6c2d4" }}
          >
            Browse prediction pools for every World Cup 2026 match. Argentina vs
            Brazil is live on X Layer testnet — others coming soon.
          </p>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-1.5 mb-10 p-1 rounded-full w-fit overflow-x-auto"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(232,238,245,0.08)",
          }}
        >
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: isActive ? "rgba(0,212,255,0.12)" : "transparent",
                  color: isActive ? "#38e0ff" : "#6b7a8f",
                  border: isActive
                    ? "1px solid rgba(0,212,255,0.3)"
                    : "1px solid transparent",
                }}
              >
                {t.label}
                {t.key === "live" && (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((match, index) => (
            <MarketCard key={match.id} match={match} index={index} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-lg font-semibold" style={{ color: "#6b7a8f" }}>
              No markets in this category
            </div>
            <button
              onClick={() => setTab("all")}
              className="mt-3 text-sm font-medium cursor-pointer"
              style={{ color: "#38e0ff" }}
            >
              View all markets
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <span
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: "#6b7a8f" }}
          >
            {MARKETS.length} markets tracked &middot; Group stage &middot; World
            Cup 2026
          </span>
        </div>
      </div>
    </section>
  );
}
