"use client";

import Link from "next/link";
import { useWeb3 } from "@/context/Web3Context";
import { PredictaPoolLogo, IconWallet } from "@/components/icons";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const { address, handleConnect } = useWeb3();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#05080e]/70 backdrop-blur-xl border-b border-[rgba(232,238,245,0.08)]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px] h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <PredictaPoolLogo size={32} />
          <span className="font-display font-semibold text-lg text-[#e8eef5] tracking-tight">
            PredictaPool
          </span>
          <span className="font-data text-[10px] text-[#6b7a8f] px-2 py-0.5 border border-[rgba(232,238,245,0.08)] rounded-md uppercase tracking-[0.06em] ml-1">
            Testnet
          </span>
        </Link>

        <nav className="hidden md:flex gap-9">
          <Link href="/markets" className="text-sm text-[#b6c2d4] hover:text-[#e8eef5] transition-colors">Markets</Link>
          <Link href="/markets/arg-bra" className="text-sm text-[#b6c2d4] hover:text-[#e8eef5] transition-colors">Predict</Link>
          <Link href="/dashboard" className="text-sm text-[#b6c2d4] hover:text-[#e8eef5] transition-colors">Dashboard</Link>
          <Link href="/#how" className="text-sm text-[#b6c2d4] hover:text-[#e8eef5] transition-colors">How It Works</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)] rounded-full">
            <span className="size-1.5 rounded-full bg-[#22c55e] pulse-dot" style={{ boxShadow: "0 0 4px #22c55e" }} />
            <span className="font-data text-[11px] text-[#38e0ff]">X Layer</span>
          </div>

          {address ? (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-[18px] py-[10px] rounded-full bg-[rgba(34,197,94,0.14)] text-[#b9f0c9] font-semibold text-sm cursor-pointer border-0"
              style={{ boxShadow: "inset 0 0 0 1px rgba(34, 197, 94, 0.5)" }}
            >
              <span className="size-2 rounded-full bg-[#22c55e]" style={{ boxShadow: "0 0 6px #22c55e" }} />
              <span className="font-data text-[13px]">{truncate(address)}</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="btn-cyan inline-flex items-center gap-2 px-[18px] py-[10px] text-sm font-semibold tracking-tight"
            >
              <IconWallet size={14} /> Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
