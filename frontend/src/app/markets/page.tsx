"use client";

import Link from "next/link";
import { useState } from "react";
import { MARKETS, type MarketStatus } from "@/lib/markets";

const TABS: { label: string; value: MarketStatus | "all" }[] = [
  { label: "All Markets", value: "all" },
  { label: "Live", value: "live" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Settled", value: "settled" },
];

export default function MarketsPage() {
  const [tab, setTab] = useState<MarketStatus | "all">("all");
  const filtered =
    tab === "all" ? MARKETS : MARKETS.filter((m) => m.status === tab);

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        <div className="mb-12">
          <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
            FIFA World Cup 2026
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-[56px] font-bold tracking-[-0.03em] leading-[1.0] mt-4 text-[#e8eef5]">
            All Markets
          </h1>
          <p className="text-lg text-[#b6c2d4] leading-[1.55] mt-3 max-w-[560px]">
            Browse prediction pools for every World Cup 2026 match. Argentina vs
            Brazil is live on X Layer testnet — others coming soon.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-full font-data text-sm transition-colors cursor-pointer ${
                tab === t.value
                  ? "bg-[rgba(0,212,255,0.12)] text-[#38e0ff] border border-[rgba(0,212,255,0.3)]"
                  : "bg-transparent text-[#6b7a8f] border border-[rgba(232,238,245,0.08)] hover:border-[rgba(232,238,245,0.2)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/markets/${m.id}`}
              className={`block bg-[#0a1019] border rounded-[20px] p-5 transition-all hover:-translate-y-0.5 ${
                m.featured
                  ? "border-[rgba(0,212,255,0.35)] shadow-[0_0_40px_-12px_rgba(0,212,255,0.3)]"
                  : "border-[rgba(232,238,245,0.08)] hover:border-[rgba(232,238,245,0.2)]"
              }`}
            >
              {m.featured && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ background: m.teamAColor }}
                  />
                  <span className="font-display font-semibold text-sm text-[#e8eef5]">
                    {m.teamACode}
                  </span>
                  <span className="text-[#6b7a8f] text-xs mx-1">vs</span>
                  <span className="font-display font-semibold text-sm text-[#e8eef5]">
                    {m.teamBCode}
                  </span>
                  <span
                    className="size-3 rounded-full"
                    style={{ background: m.teamBColor }}
                  />
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em] ${
                    m.status === "live"
                      ? "bg-[rgba(34,197,94,0.14)] text-[#6ee7a0] border border-[rgba(34,197,94,0.35)]"
                      : m.status === "upcoming"
                        ? "bg-[rgba(0,212,255,0.08)] text-[#38e0ff] border border-[rgba(0,212,255,0.2)]"
                        : "bg-[rgba(107,122,143,0.1)] text-[#6b7a8f] border border-[rgba(107,122,143,0.2)]"
                  }`}
                >
                  {m.status === "live" && (
                    <span className="size-1.5 rounded-full bg-[#22c55e] pulse-dot" />
                  )}
                  {m.status}
                </div>
              </div>

              <div className="font-display font-semibold text-base text-[#e8eef5] mb-1">
                {m.teamA} vs {m.teamB}
              </div>
              {m.group && (
                <div className="font-data text-[11px] text-[#6b7a8f] mb-4">
                  {m.group} {m.venue && `· ${m.venue}`}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[rgba(232,238,245,0.06)]">
                <div>
                  <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                    Pool
                  </div>
                  <div className="font-data text-sm font-medium text-[#e8eef5]">
                    {m.poolSize}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                    {m.status === "settled" ? "Result" : "Time Left"}
                  </div>
                  <div className="font-data text-sm font-medium text-[#e8eef5]">
                    {m.timeRemaining}
                  </div>
                </div>
              </div>

              {m.isReal && (
                <div className="mt-3 text-center font-data text-[10px] text-[#00d4ff] uppercase tracking-[0.1em]">
                  Live on-chain · Click to predict
                </div>
              )}
              {!m.isReal && m.status === "upcoming" && (
                <div className="mt-3 text-center font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                  Deposits opening soon
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
