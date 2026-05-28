"use client";

import Link from "next/link";
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
    <section className="relative overflow-hidden min-h-[100vh]">
      {/* Full-bleed background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-bg.png"
        alt=""
        className="absolute inset-0 z-0 w-full h-full object-cover object-center"
      />

      {/* Gradient overlays for text readability */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(5,16,24,0.92) 0%, rgba(5,16,24,0.7) 40%, rgba(5,16,24,0.2) 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to top, rgba(5,16,24,0.95) 0%, rgba(5,16,24,0.5) 30%, transparent 60%)",
        }}
      />
      {/* Extra top fade for navbar blending */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,16,24,0.6) 0%, transparent 20%)",
        }}
      />

      {/* Content */}
      <div className="relative z-[2] max-w-[1320px] mx-auto px-6 lg:px-[60px] pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center min-h-[70vh]">
          {/* Left: Text content */}
          <div>
            {/* Live badge */}
            <div
              className="animate-fade-in-up inline-flex items-center gap-2.5 px-3 py-1.5 pr-3.5 rounded-full text-xs uppercase tracking-[0.04em] font-semibold"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.28)",
                color: "#38e0ff",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="size-1.5 rounded-full animate-pulse"
                style={{
                  background: "#38e0ff",
                  boxShadow: "0 0 12px #00d4ff",
                }}
              />
              FIFA World Cup 2026 &middot; Live on X Layer Testnet
            </div>

            {/* Heading */}
            <h1
              className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-[88px] leading-[0.95] font-bold tracking-[-0.035em] mt-6 mb-6"
              style={{ color: "#e8eef5" }}
            >
              Predict the <span style={{ color: "#22c55e" }}>match.</span>
              <br />
              Earn real <span style={{ color: "#00d4ff" }}>yield.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="animate-fade-in-up delay-200 text-lg sm:text-xl leading-[1.6] max-w-[560px] mb-9"
              style={{ color: "#b6c2d4" }}
            >
              Yield-backed prediction markets for the World Cup. Your deposit
              becomes Uniswap V4 liquidity that earns real swap fees. Winners
              take the yield; everyone else reclaims their principal, minus any
              LP impermanent loss.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up delay-300 flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={onConnect}
                className="inline-flex items-center gap-2.5 px-7 py-4 text-base font-semibold rounded-full cursor-pointer border-0 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02]"
                style={{
                  background: "#00d4ff",
                  color: "#051018",
                  boxShadow:
                    "0 0 0 1px rgba(0,212,255,0.4), 0 16px 40px -12px rgba(0,212,255,0.5)",
                }}
              >
                {isConnected ? "View My Positions" : "Connect Wallet"}{" "}
                <IconArrow />
              </button>
              <Link
                href="/markets"
                className="inline-flex items-center px-[22px] py-4 text-base font-medium rounded-full cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                style={{
                  color: "#e8eef5",
                  border: "1px solid rgba(232,238,245,0.16)",
                  backdropFilter: "blur(8px)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                Browse Matches
              </Link>
            </div>

            {/* Built On badges */}
            <div
              className="animate-fade-in-up delay-400 flex flex-wrap items-center gap-4 lg:gap-7 pt-7"
              style={{ borderTop: "1px solid rgba(232,238,245,0.08)" }}
            >
              <span
                className="text-[11px] uppercase tracking-[0.1em] font-semibold"
                style={{ color: "#6b7a8f" }}
              >
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
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(232,238,245,0.08)",
                      color: "#b6c2d4",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {c.icon} {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Football hero image */}
          <div className="animate-fade-in delay-300 relative hidden lg:flex items-center justify-center">
            {/* Glow behind ball */}
            <div
              className="absolute z-0"
              style={{
                width: "460px",
                height: "460px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(34,197,94,0.1) 40%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            {/* Football image */}
            <div className="relative z-[1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/football-hero.png"
                alt="Football"
                style={{
                  width: 380,
                  height: 380,
                  objectFit: "contain",
                  mixBlendMode: "lighten",
                  filter: "drop-shadow(0 0 40px rgba(0,212,255,0.4))",
                  maskImage:
                    "radial-gradient(circle, black 55%, transparent 72%)",
                  WebkitMaskImage:
                    "radial-gradient(circle, black 55%, transparent 72%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
