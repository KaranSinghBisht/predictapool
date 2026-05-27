"use client";

import {
  IconCheck,
  IconX,
  UniswapMark,
  XLayerMark,
  FoundryMark,
} from "@/components/icons";

const STATS = [
  { v: "$2.41", unit: "M", k: "Total Deposited · All Markets" },
  { v: "104", unit: "", k: "World Cup Matches Tracked" },
  { v: "11,402", unit: "", k: "Wallets Predicting" },
  { v: "0", unit: "", k: "Principal Lost to Date", accent: true },
];

const COMPARE_ROWS = [
  {
    feature: "Principal protection",
    pp: "Always returned",
    other: "Forfeit on loss",
  },
  { feature: "Yield source", pp: "V4 swap fees", other: "None" },
  { feature: "Settlement", pp: "On-chain oracle", other: "Off-chain admin" },
  { feature: "Custody", pp: "Non-custodial", other: "Mixed" },
  { feature: "Order matching", pp: "AMM hook", other: "CLOB / Bookmaker" },
  { feature: "Gas (per predict)", pp: "<$0.01 on X Layer", other: "$2 – $30" },
];

export function StatsSection() {
  return (
    <section className="py-36" id="why">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-[rgba(232,238,245,0.08)] mb-24">
          {STATS.map((s) => (
            <div
              key={s.k}
              className="py-10 px-6 border-r border-[rgba(232,238,245,0.08)] last:border-r-0"
            >
              <div
                className="font-display text-3xl sm:text-4xl md:text-[56px] font-semibold tracking-[-0.03em] leading-none"
                style={s.accent ? { color: "#22c55e" } : undefined}
              >
                {s.v}
                {s.unit && (
                  <span
                    className="font-data text-[22px] font-medium text-[#00d4ff] ml-0.5"
                    style={s.accent ? { color: "#22c55e" } : undefined}
                  >
                    {s.unit}
                  </span>
                )}
              </div>
              <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mt-3">
                {s.k}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-start">
          <div>
            <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
              Why PredictaPool
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] font-bold tracking-[-0.03em] leading-[1.05] mt-4 mb-5 text-[#e8eef5]">
              A prediction market
              <br />
              that doesn&apos;t take
              <br />
              your stake.
            </h2>
            <p className="text-[17px] text-[#b6c2d4] leading-[1.55] mb-6">
              Most prediction markets are zero-sum — winners take losers&apos;
              money. PredictaPool replaces that with a positive-sum design: your
              deposit becomes productive liquidity, and only the yield changes
              hands at settlement.
            </p>
            <a
              href="#predict"
              className="btn-ghost inline-flex px-[18px] py-3 text-sm font-medium"
            >
              Read the whitepaper
            </a>
          </div>

          <div className="bg-[#0a1019] border border-[rgba(232,238,245,0.08)] rounded-[20px] overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_1fr]">
              {["Feature", "PredictaPool", "Typical Market"].map((h, i) => (
                <div
                  key={h}
                  className={`px-5 py-4 bg-[rgba(0,0,0,0.25)] font-data text-[11px] uppercase tracking-[0.1em] border-b border-[rgba(232,238,245,0.08)] ${i === 1 ? "text-[#00d4ff] text-center" : "text-[#6b7a8f]"} ${i > 0 ? "text-center" : ""}`}
                >
                  {h}
                </div>
              ))}
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-[1.4fr_1fr_1fr]">
                <div
                  className={`px-5 py-4 text-sm font-medium text-[#e8eef5] ${i < COMPARE_ROWS.length - 1 ? "border-b border-[rgba(232,238,245,0.08)]" : ""}`}
                >
                  {row.feature}
                </div>
                <div
                  className={`px-5 py-4 text-center font-data text-[13px] text-[#22c55e] bg-[rgba(0,212,255,0.04)] flex items-center justify-center gap-1.5 ${i < COMPARE_ROWS.length - 1 ? "border-b border-[rgba(232,238,245,0.08)]" : ""}`}
                >
                  <IconCheck size={12} /> {row.pp}
                </div>
                <div
                  className={`px-5 py-4 text-center font-data text-[13px] text-[#6b7a8f] flex items-center justify-center gap-1.5 ${i < COMPARE_ROWS.length - 1 ? "border-b border-[rgba(232,238,245,0.08)]" : ""}`}
                >
                  <IconX size={12} /> {row.other}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* X Layer callout */}
        <div
          className="mt-20 relative rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,212,255,0.02) 100%)",
            padding: "2px",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,212,255,0.35), rgba(56,224,255,0.08) 50%, rgba(0,212,255,0.20))",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1.5px",
            }}
          />
          <div
            className="relative rounded-2xl px-5 py-6 sm:px-10 sm:py-9 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8"
            style={{ background: "#080f1a" }}
          >
            <div
              className="shrink-0 size-14 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(160deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%)",
                border: "1px solid rgba(0,212,255,0.25)",
                boxShadow: "0 0 24px -6px rgba(0,212,255,0.3)",
              }}
            >
              <XLayerMark size={26} />
            </div>
            <div>
              <p className="font-display text-[20px] font-semibold text-[#e8eef5] leading-snug mb-1.5">
                Deployed on X&nbsp;Layer{" "}
                <span className="font-data text-sm font-normal text-[#6b7a8f]">
                  &mdash; OKX&apos;s Layer&nbsp;2 powered by Polygon CDK
                </span>
              </p>
              <p className="text-[15px] text-[#b6c2d4] leading-[1.55]">
                Sub-cent gas costs make micro-predictions viable for the first
                time. Deposit{" "}
                <span className="font-data text-[#38e0ff]">$0.50</span> or{" "}
                <span className="font-data text-[#38e0ff]">$5,000</span> &mdash;
                the gas is the same fraction of a penny.
              </p>
            </div>
          </div>
        </div>

        {/* Logos strip */}
        <div className="mt-20 pt-10 border-t border-[rgba(232,238,245,0.08)] flex items-center justify-between flex-wrap gap-6">
          <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.18em]">
            Stack
          </span>
          <div className="flex flex-wrap gap-6 lg:gap-12 items-center">
            <div className="font-display font-semibold text-lg text-[#b6c2d4] flex items-center gap-2.5">
              <UniswapMark size={22} /> Uniswap V4
            </div>
            <div className="font-display font-semibold text-lg text-[#b6c2d4] flex items-center gap-2.5">
              <XLayerMark size={22} /> X Layer
            </div>
            <div className="font-display font-semibold text-lg text-[#b6c2d4] flex items-center gap-2.5">
              <FoundryMark size={22} /> Foundry
            </div>
          </div>
          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(34,197,94,0.1)] border border-[rgba(0,212,255,0.3)] rounded-full font-data text-xs text-[#38e0ff]">
            <span
              className="size-1.5 rounded-full bg-[#00d4ff]"
              style={{ boxShadow: "0 0 6px #00d4ff" }}
            />
            Built for #HookTheFuture
          </div>
        </div>
      </div>
    </section>
  );
}
