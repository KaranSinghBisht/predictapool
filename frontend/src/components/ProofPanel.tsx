"use client";

import { useState } from "react";
import {
  CONTRACT_LINKS,
  LIFECYCLE_TXS,
  EVENT_ID,
  explorerAddr,
  explorerTx,
} from "@/lib/contracts";

function truncate(s: string) {
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable — explorer link still works */
        }
      }}
      className="font-data text-[10px] uppercase tracking-[0.08em] text-[#6b7a8f] hover:text-[#38e0ff] transition-colors cursor-pointer"
      aria-label="Copy address"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function LiveStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="font-data text-[10px] text-[#6b7a8f] uppercase tracking-[0.1em]">
        {label}
      </div>
      <div
        className="font-data text-[17px] font-semibold mt-1"
        style={{ color: accent ? "#22c55e" : "#e8eef5" }}
      >
        {value}
      </div>
    </div>
  );
}

interface ProofPanelProps {
  /** Live total pool (already formatted, e.g. "$10.9k"). */
  pool?: string;
  /** Live on-chain swap count. */
  swaps?: number;
  /** Live hook-driven fee in pips (1e6 = 100%). */
  feePips?: number;
  className?: string;
}

export function ProofPanel({
  pool,
  swaps,
  feePips,
  className,
}: ProofPanelProps) {
  const hasLive = pool !== undefined || swaps !== undefined;

  return (
    <section
      id="verify"
      className={`relative rounded-[20px] overflow-hidden ${className ?? ""}`}
      style={{
        background: "rgba(5,8,14,0.85)",
        border: "1px solid rgba(232,238,245,0.1)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)",
        }}
      />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span
              className="size-2 rounded-full bg-[#22c55e] pulse-dot"
              style={{ boxShadow: "0 0 8px #22c55e" }}
            />
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-[-0.02em] text-[#e8eef5]">
              Verify on-chain
            </h2>
          </div>
          <span className="font-data text-[11px] text-[#38e0ff] uppercase tracking-[0.1em]">
            X Layer Testnet · Chain 1952
          </span>
        </div>
        <p className="text-sm text-[#b6c2d4] leading-relaxed max-w-[660px] mb-6">
          Nothing here is mocked. The Uniswap V4 hook governs the live pool — it
          sets a deadline-aware swap fee and locks trading at settlement. Every
          contract and transaction below is verifiable on the block explorer.
        </p>

        {/* Live readout */}
        {hasLive && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden mb-6"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(232,238,245,0.08)",
            }}
          >
            <div className="border-r border-[rgba(232,238,245,0.08)]">
              <LiveStat label="Live Pool" value={pool ?? "—"} accent />
            </div>
            <div className="border-r border-[rgba(232,238,245,0.08)]">
              <LiveStat
                label="On-chain Swaps"
                value={swaps !== undefined ? swaps.toLocaleString() : "—"}
              />
            </div>
            <div className="sm:border-r border-[rgba(232,238,245,0.08)]">
              <LiveStat
                label="Hook Fee"
                value={
                  feePips !== undefined && feePips > 0
                    ? `${(feePips / 10000).toFixed(2)}%`
                    : "—"
                }
                accent
              />
            </div>
            <a
              href={`${explorerAddr(CONTRACT_LINKS[0].addr)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-[rgba(0,212,255,0.04)] transition-colors col-span-2 sm:col-span-1"
            >
              <LiveStat label="Event ID" value={truncate(EVENT_ID)} />
            </a>
          </div>
        )}

        {/* Contracts */}
        <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mb-3">
          Deployed contracts
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-7">
          {CONTRACT_LINKS.map((c) => (
            <div
              key={c.addr}
              className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(232,238,245,0.07)",
              }}
            >
              <div className="min-w-0">
                <div className="font-data text-[12px] text-[#e8eef5] truncate">
                  {c.label}
                </div>
                <a
                  href={explorerAddr(c.addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-data text-[11px] text-[#38e0ff] hover:underline"
                >
                  {truncate(c.addr)}
                </a>
              </div>
              <CopyButton value={c.addr} />
            </div>
          ))}
        </div>

        {/* Lifecycle */}
        <div className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mb-3">
          Full lifecycle · click any step to verify
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LIFECYCLE_TXS.map((t, i) => (
            <a
              key={t.hash}
              href={explorerTx(t.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg px-3 py-3 transition-all hover:-translate-y-0.5"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(232,238,245,0.08)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="font-data text-[10px] text-[#6b7a8f]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="font-data text-[8px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
                  style={{
                    color: t.live ? "#6ee7a0" : "#6b7a8f",
                    background: t.live
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(107,122,143,0.12)",
                  }}
                >
                  {t.live ? "live" : "demo"}
                </span>
              </div>
              <div className="font-display text-[13px] font-semibold text-[#e8eef5] group-hover:text-[#38e0ff] transition-colors">
                {t.step}
              </div>
              <div className="font-data text-[10px] text-[#6b7a8f] mt-0.5 truncate">
                {truncate(t.hash)}
              </div>
            </a>
          ))}
        </div>

        {/* Completed market — the payoff, settled on-chain */}
        <div
          className="mt-4 rounded-lg px-4 py-3"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div className="font-data text-[11px] text-[#6ee7a0] uppercase tracking-[0.1em] mb-1">
            Completed market · settled on-chain
          </div>
          <p className="text-[13px] text-[#b6c2d4] leading-relaxed">
            A finished event (France vs Germany) took in{" "}
            <span className="text-[#e8eef5]">10,000</span> and returned{" "}
            <span className="text-[#e8eef5]">10,006</span> to depositors —
            winners claimed principal plus the LP yield, and losing predictions
            got their principal back. The resolve, settle &amp; claim txs are
            linked above.
          </p>
        </div>
      </div>
    </section>
  );
}
