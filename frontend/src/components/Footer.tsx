"use client";

import { PredictaPoolLogo } from "@/components/icons";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Matches", href: "#predict" },
      { label: "Positions", href: "#" },
      { label: "Settlements", href: "#" },
      { label: "Faucet", href: "#" },
    ],
  },
  {
    title: "Build",
    links: [
      { label: "Docs", href: "#" },
      {
        label: "Hook Source",
        href: "https://github.com/KaranSinghBisht/predictapool",
      },
      { label: "Explorer", href: "https://www.oklink.com/xlayer-test" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "X / Twitter", href: "https://x.com/PredictaPool" },
      {
        label: "GitHub",
        href: "https://github.com/KaranSinghBisht/predictapool",
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="py-20 pb-10 border-t border-[rgba(232,238,245,0.08)] bg-[#05080e]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 md:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <PredictaPoolLogo size={32} />
              <span className="font-display font-semibold text-lg text-[#e8eef5]">
                PredictaPool
              </span>
            </div>
            <p className="text-sm text-[#b6c2d4] leading-[1.6] mt-4 max-w-[320px]">
              Predict the match. Earn real yield. A Uniswap V4 hook turning
              prediction markets into productive liquidity, live on X Layer for
              FIFA World Cup 2026.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.12em] mb-4">
                {col.title}
              </h4>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="block text-sm text-[#b6c2d4] py-1.5 hover:text-[#00d4ff] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t border-[rgba(232,238,245,0.08)] flex flex-col sm:flex-row justify-between gap-2 font-data text-xs text-[#6b7a8f]">
          <span>
            &copy; 2026 PredictaPool &middot; Not affiliated with FIFA
          </span>
          <span>v0.4.1 &middot; Hook 0xcc42…8A40 &middot; X Layer 1952</span>
        </div>
      </div>
    </footer>
  );
}
