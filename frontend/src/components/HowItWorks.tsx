"use client";

const STEPS = [
  {
    n: "01",
    label: "Deposit",
    title: "Pick a side, deposit ppUSDC.",
    desc: "Your tokens enter a per-outcome vault. The contract atomically wraps them into a Uniswap V4 LP position routed through the PredictaPool hook.",
    code: "vault.deposit(match_id, outcome, amount)",
  },
  {
    n: "02",
    label: "Earn",
    title: "The hook collects swap fees.",
    desc: "While the match approaches, every swap in the underlying pool drips fees back to your vault. The hook tags fees by outcome so winners can claim them at settlement.",
    code: "afterSwap → accrue(outcome) · 24/7",
  },
  {
    n: "03",
    label: "Claim",
    title: "Winners take yield. Everyone keeps principal.",
    desc: "Once the oracle settles the match, winning depositors withdraw principal plus all accrued yield. Losing depositors withdraw their full deposit — no loss.",
    code: "vault.claim() → principal + yield",
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-36 relative"
      id="how"
      style={{
        background: "linear-gradient(180deg, #06140d 0%, #05080e 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 30%, rgba(0,212,255,0.10), transparent 50%)",
        }}
      />
      <div className="relative max-w-[1320px] mx-auto px-6 lg:px-[60px]">
        <div className="max-w-[760px] mb-14">
          <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
            How It Works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[56px] font-bold leading-[1.0] tracking-[-0.03em] mt-4 mb-4 text-[#e8eef5]">
            Three blocks. No middlemen.
          </h2>
          <p className="text-lg text-[#b6c2d4] leading-[1.55]">
            Every prediction follows the same path through the protocol — from
            your deposit to the V4 hook to the moment you claim.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3">
          {/* Dashed connector line */}
          <div
            className="hidden md:block absolute top-16 left-[8%] right-[8%] h-px z-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(0,212,255,0.5) 0 8px, transparent 8px 16px)",
            }}
          />

          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="relative z-[1] px-4 md:px-7"
              style={{ transform: i === 1 ? undefined : undefined }}
            >
              <div
                className="hidden md:block"
                style={{ height: i === 1 ? 60 : 0 }}
              />
              <div
                className="size-16 md:size-24 rounded-2xl md:rounded-3xl flex items-center justify-center font-data text-2xl md:text-[32px] font-medium text-[#00d4ff] mb-6 relative"
                style={{
                  background:
                    "linear-gradient(160deg, #0a1b12 0%, #06140d 100%)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  boxShadow: "0 12px 40px -12px rgba(0,212,255,0.4)",
                }}
              >
                {step.n}
                <span className="absolute -bottom-2.5 -right-2.5 bg-[#00d4ff] text-[#051018] font-data text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-[0.08em]">
                  {step.label}
                </span>
              </div>
              <h3 className="font-display text-xl md:text-[28px] font-semibold tracking-[-0.02em] mb-3 text-[#e8eef5]">
                {step.title}
              </h3>
              <p className="text-[15px] text-[#b6c2d4] leading-[1.55] mb-4">
                {step.desc}
              </p>
              <div className="font-data text-xs text-[#38e0ff]">
                {step.code.split("→").map((part, j) => (
                  <span key={j}>
                    {j > 0 && <span> → </span>}
                    {part.includes("accrue") ||
                    part.includes("principal") ||
                    part.includes("match_id") ? (
                      <span className="text-[#22c55e]">{part}</span>
                    ) : (
                      part
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
