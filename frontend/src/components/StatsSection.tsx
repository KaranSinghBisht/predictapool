"use client";

import {
  IconCheck,
  IconX,
  UniswapMark,
  XLayerMark,
  FoundryMark,
} from "@/components/icons";

const STATS = [
  { v: "Live", unit: "", k: "Market Status" },
  { v: "1", unit: "", k: "Live On-Chain Match" },
  { v: "82", unit: "", k: "Passing Tests", accent: true },
  { v: "Testnet", unit: "", k: "Network" },
];

const COMPARE_ROWS = [
  {
    feature: "Principal protection",
    pp: "Principal-targeted",
    other: "Forfeit on loss",
  },
  { feature: "Yield source", pp: "V4 swap fees", other: "None" },
  {
    feature: "Settlement",
    pp: "On-chain (owner oracle)",
    other: "Off-chain admin",
  },
  { feature: "Custody", pp: "Non-custodial", other: "Mixed" },
  { feature: "Order matching", pp: "AMM hook", other: "CLOB / Bookmaker" },
  { feature: "Gas (per predict)", pp: "<$0.01 on X Layer", other: "$2 – $30" },
];

export function StatsSection() {
  return (
    <section className="py-36 relative overflow-hidden" id="why">
      {/* Full-section background: crowd-bg.png with very heavy overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/crowd-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.90)" }}
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        {/* Stats row with trophy */}
        <div className="relative mb-24">
          <div
            className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(232,238,245,0.08)",
              background: "rgba(5,8,14,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={s.k}
                className={`animate-fade-in ${["", "delay-100", "delay-200", "delay-300"][i] ?? ""} py-10 px-6`}
                style={
                  i < STATS.length - 1
                    ? { borderRight: "1px solid rgba(232,238,245,0.08)" }
                    : undefined
                }
              >
                <div
                  className="font-display text-3xl sm:text-4xl md:text-[56px] font-semibold tracking-[-0.03em] leading-none"
                  style={s.accent ? { color: "#22c55e" } : undefined}
                >
                  {s.v}
                  {s.unit && (
                    <span
                      className="font-data text-[22px] font-medium ml-0.5"
                      style={{ color: s.accent ? "#22c55e" : "#00d4ff" }}
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
        </div>

        {/* Comparison section */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "rgba(5,8,14,0.85)",
            border: "1px solid rgba(232,238,245,0.08)",
          }}
        >
          <div className="relative z-10 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-start p-8 md:p-12 lg:p-16">
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
                money. PredictaPool replaces that with a positive-sum design:
                your deposit becomes productive liquidity, and only the yield
                changes hands at settlement.
              </p>
              <a
                href="https://github.com/KaranSinghBisht/predictapool"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex px-[18px] py-3 text-sm font-medium"
              >
                View the hook source
              </a>
            </div>

            <div
              className="rounded-[20px] overflow-hidden"
              style={{
                background: "rgba(5,8,14,0.7)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(232,238,245,0.10)",
                boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)",
              }}
            >
              <div className="grid grid-cols-[1.4fr_1fr_1fr]">
                {["Feature", "PredictaPool", "Typical Market"].map((h, i) => (
                  <div
                    key={h}
                    className={`px-5 py-4 font-data text-[11px] uppercase tracking-[0.1em] ${i === 1 ? "text-center" : ""} ${i > 0 ? "text-center" : ""}`}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      color: i === 1 ? "#00d4ff" : "#6b7a8f",
                      borderBottom: "1px solid rgba(232,238,245,0.08)",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {COMPARE_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-[1.4fr_1fr_1fr]"
                >
                  <div
                    className="px-5 py-4 text-sm font-medium text-[#e8eef5]"
                    style={
                      i < COMPARE_ROWS.length - 1
                        ? {
                            borderBottom: "1px solid rgba(232,238,245,0.08)",
                          }
                        : undefined
                    }
                  >
                    {row.feature}
                  </div>
                  <div
                    className="px-5 py-4 text-center font-data text-[13px] flex items-center justify-center gap-1.5"
                    style={{
                      color: "#22c55e",
                      background: "rgba(0,212,255,0.04)",
                      ...(i < COMPARE_ROWS.length - 1
                        ? {
                            borderBottom: "1px solid rgba(232,238,245,0.08)",
                          }
                        : {}),
                    }}
                  >
                    <IconCheck size={12} /> {row.pp}
                  </div>
                  <div
                    className="px-5 py-4 text-center font-data text-[13px] text-[#6b7a8f] flex items-center justify-center gap-1.5"
                    style={
                      i < COMPARE_ROWS.length - 1
                        ? {
                            borderBottom: "1px solid rgba(232,238,245,0.08)",
                          }
                        : undefined
                    }
                  >
                    <IconX size={12} /> {row.other}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* X Layer callout — kept as-is */}
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
        <div
          className="mt-20 pt-10 flex items-center justify-between flex-wrap gap-6"
          style={{ borderTop: "1px solid rgba(232,238,245,0.08)" }}
        >
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
          <div
            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full font-data text-xs text-[#38e0ff]"
            style={{
              background:
                "linear-gradient(to right, rgba(0,212,255,0.1), rgba(34,197,94,0.1))",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: "#00d4ff",
                boxShadow: "0 0 6px #00d4ff",
              }}
            />
            Built on Uniswap V4 · X Layer
          </div>
        </div>
      </div>
    </section>
  );
}
