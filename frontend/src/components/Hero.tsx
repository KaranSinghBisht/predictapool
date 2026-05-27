"use client";

import {
  IconArrow,
  UniswapMark,
  XLayerMark,
  FoundryMark,
} from "@/components/icons";

interface HeroProps {
  onConnect: () => void;
  isConnected: boolean;
}

export function Hero({ onConnect, isConnected }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-20 pb-[120px]">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 900px 500px at 20% 0%, rgba(22,163,74,0.22), transparent 60%),
            radial-gradient(ellipse 800px 600px at 100% 30%, rgba(0,212,255,0.18), transparent 60%),
            linear-gradient(180deg, #051a10 0%, #051018 60%, #05080e 100%)
          `,
        }}
      />
      <div className="absolute inset-0 z-0 pitch-pattern opacity-[0.32]" />

      <div className="relative z-[1] max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_540px] gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 pr-3.5 bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.28)] rounded-full font-data text-xs text-[#38e0ff] uppercase tracking-[0.04em]">
              <span
                className="size-1.5 rounded-full bg-[#38e0ff] pulse-dot"
                style={{ boxShadow: "0 0 12px #00d4ff" }}
              />
              FIFA World Cup 2026 · Live on X Layer Testnet
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[88px] leading-[0.95] font-bold tracking-[-0.035em] mt-6 mb-6">
              Predict the <span className="text-[#22c55e]">match.</span>
              <br />
              Earn real <span className="text-[#00d4ff]">yield.</span>
            </h1>

            <p className="text-xl text-[#b6c2d4] leading-[1.5] max-w-[560px] mb-9">
              Yield-backed prediction markets for the World Cup. Your deposit
              becomes Uniswap V4 liquidity that earns real swap fees. Winners
              take the yield — losers keep every dollar of principal.
            </p>

            <div className="flex items-center gap-4 mb-12">
              <button
                onClick={onConnect}
                className="btn-cyan px-7 py-4 text-base font-display font-semibold inline-flex items-center gap-2.5"
              >
                {isConnected ? "View My Positions" : "Connect Wallet"}{" "}
                <IconArrow />
              </button>
              <a
                href="#predict"
                className="btn-ghost px-[22px] py-4 text-base font-medium"
              >
                Browse Matches
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:gap-7 pt-7 border-t border-[rgba(232,238,245,0.08)]">
              <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
                Built On
              </span>
              <div className="flex flex-wrap gap-3 lg:gap-5">
                {[
                  { icon: <UniswapMark />, label: "Uniswap V4 Hook" },
                  { icon: <XLayerMark />, label: "X Layer · ChainID 1952" },
                  { icon: <FoundryMark />, label: "Foundry-tested" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(232,238,245,0.08)] rounded-[10px] text-[13px] font-medium text-[#b6c2d4]"
                  >
                    {c.icon} {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating orb */}
          <div className="relative hidden lg:flex items-center justify-center h-[540px]">
            <div className="absolute inset-[-40px] bg-[radial-gradient(circle,rgba(0,212,255,0.35),transparent_65%)] blur-[20px] z-0" />
            <div className="absolute size-[520px] rounded-full border border-[rgba(0,212,255,0.25)]" />
            <div className="absolute size-[400px] rounded-full border border-[rgba(34,197,94,0.22)]" />
            <div className="absolute size-[280px] rounded-full border border-[rgba(0,212,255,0.35)]" />
            <div className="relative z-[2]">
              <img
                src="/logo.png"
                alt="PredictaPool"
                className="size-[200px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
