"use client";

import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Context";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { StatsSection } from "@/components/StatsSection";
import { MarketsSection } from "@/components/MarketsSection";
import { ProofPanel } from "@/components/ProofPanel";
import Link from "next/link";

function fmtPool(v: bigint): string {
  const n = parseFloat(ethers.formatEther(v));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export default function Home() {
  const { address, handleConnect, connectError, eventData } = useWeb3();
  const pool = eventData ? fmtPool(eventData.totalDeposit0) : undefined;
  const swaps = eventData ? eventData.swapCount : undefined;

  return (
    <>
      <Hero onConnect={handleConnect} isConnected={!!address} />

      {connectError && (
        <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px] mb-4">
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-400 font-data">
            {connectError}
          </div>
        </div>
      )}

      {/* Verify on-chain — trust anchor right after the hero */}
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px] py-14">
        <ProofPanel pool={pool} swaps={swaps} feePips={eventData?.feePips} />
      </div>

      <MarketsSection />

      {/* CTA to full markets */}
      <div className="text-center pb-20">
        <Link
          href="/markets"
          className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
        >
          View All Markets &rarr;
        </Link>
      </div>

      <HowItWorks />
      <StatsSection />
    </>
  );
}
