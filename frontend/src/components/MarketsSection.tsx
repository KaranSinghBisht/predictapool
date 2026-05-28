"use client";

import Link from "next/link";
import { MARKETS, type MarketMatch, type MarketStatus } from "@/lib/markets";
import { Flag } from "@/components/Flag";

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

function PreviewCard({ match, index }: { match: MarketMatch; index: number }) {
  const isFeatured = match.featured;
  const isSettled = match.status === "settled";
  const isLive = match.status === "live";
  const bg = getBackgroundImage(match);

  return (
    <Link
      href={`/markets/${match.id}`}
      className={`group animate-fade-in-up ${DELAY_CLASSES[index] ?? ""} relative block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
      style={{
        border: isFeatured
          ? "1px solid rgba(0,212,255,0.45)"
          : "1px solid rgba(232,238,245,0.1)",
        boxShadow: isFeatured
          ? "0 0 50px -10px rgba(0,212,255,0.3), 0 0 0 1px rgba(0,212,255,0.12)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        opacity: isSettled ? 0.65 : 1,
        minHeight: "260px",
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
            "linear-gradient(180deg, rgba(6,10,18,0.55) 0%, rgba(6,10,18,0.80) 50%, rgba(6,10,18,0.92) 100%)",
        }}
      />

      {/* Featured top shimmer */}
      {isFeatured && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.7) 50%, transparent 100%)",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-5">
        {/* Top row: badges */}
        <div className="flex items-center justify-between">
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

        {/* Center: Teams */}
        <div className="flex items-center justify-center gap-4 my-5">
          <div className="text-center">
            <Flag
              code={match.teamACode}
              size={46}
              square
              className="mx-auto mb-2"
            />
            <div
              className="font-bold text-lg tracking-tight"
              style={{ color: "#e8eef5" }}
            >
              {match.teamACode}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#8899aa" }}>
              {match.teamA}
            </div>
          </div>

          <span
            className="font-bold text-sm px-3 py-1 rounded-full"
            style={{
              color: "#4a5568",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            VS
          </span>

          <div className="text-center">
            <Flag
              code={match.teamBCode}
              size={46}
              square
              className="mx-auto mb-2"
            />
            <div
              className="font-bold text-lg tracking-tight"
              style={{ color: "#e8eef5" }}
            >
              {match.teamBCode}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#8899aa" }}>
              {match.teamB}
            </div>
          </div>
        </div>

        {/* Bottom: Stats bar */}
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.45)",
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

        {!match.isReal && (
          <div className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-[#6b7a8f]">
            Preview &middot; opens on-chain soon
          </div>
        )}
      </div>

      {/* Hover glow overlay */}
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

export function MarketsSection() {
  const preview = MARKETS.filter((m) => m.status !== "settled").slice(0, 4);

  return (
    <section className="py-28 relative" id="markets">
      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#38e0ff" }}
            >
              Browse Markets
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-[44px] font-bold tracking-tight leading-[1.05] mt-4"
              style={{ color: "#e8eef5" }}
            >
              Prediction Markets
            </h2>
            <p
              className="text-[17px] leading-relaxed mt-3 max-w-[520px]"
              style={{ color: "#b6c2d4" }}
            >
              Preview of upcoming World Cup 2026 prediction pools — Argentina vs
              Brazil is live on testnet
            </p>
          </div>
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:gap-3"
            style={{
              color: "#38e0ff",
              border: "1px solid rgba(0,212,255,0.3)",
              background: "rgba(0,212,255,0.08)",
            }}
          >
            View All Markets
            <span style={{ fontSize: "16px" }}>&rarr;</span>
          </Link>
        </div>

        {/* Preview cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {preview.map((match, i) => (
            <PreviewCard key={match.id} match={match} index={i} />
          ))}
        </div>

        {/* Footer stat */}
        <div className="mt-10 text-center">
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
