"use client";

import { useWeb3 } from "@/context/Web3Context";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { StatsSection } from "@/components/StatsSection";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { MarketsSection } from "@/components/MarketsSection";
import Link from "next/link";

export default function Home() {
  const { address, handleConnect, connectError } = useWeb3();

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
      <ArchitectureDiagram />
      <StatsSection />
    </>
  );
}
