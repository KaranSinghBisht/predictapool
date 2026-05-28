"use client";

const STEPS = [
  {
    n: "01",
    label: "Deposit",
    title: "Pick a side, deposit ppUSDC.",
    desc: "Your tokens enter a per-outcome vault. The contract atomically wraps them into a Uniswap V4 LP position routed through the PredictaPool hook.",
    code: "predict(eventId, outcome, amount0, amount1)",
  },
  {
    n: "02",
    label: "Earn",
    title: "The pool earns swap fees.",
    desc: "While the match approaches, traders swap against the pool and pay LP fees. The hook's afterSwap callback records every swap on-chain; accrued fees are realized for winners at settlement.",
    code: "afterSwap → swapCount++ · realized at settle",
  },
  {
    n: "03",
    label: "Claim",
    title: "Winners take yield. Losers reclaim principal.",
    desc: "Once the oracle settles the match, winning depositors withdraw their principal plus the pool's yield. Losing depositors reclaim their principal share — minus any LP impermanent loss on volatile pairs.",
    code: "claim(eventId) → principal + yield",
  },
];

export function HowItWorks() {
  return (
    <section className="py-36 relative overflow-hidden" id="how">
      {/* Background image: tunnel-bg.png with heavy dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/tunnel-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay — 80% black */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.80)" }}
      />
      {/* Subtle cyan radial accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 30%, rgba(0,212,255,0.08), transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-[60px]">
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

        <div className="relative grid md:grid-cols-3 gap-6 md:gap-0">
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
              className={`animate-fade-in-up ${["", "delay-200", "delay-400"][i]} relative z-[1] px-4 md:px-5`}
            >
              {/* Staggered offset for middle card */}
              <div
                className="hidden md:block"
                style={{ height: i === 1 ? 60 : 0 }}
              />

              {/* Glassmorphism card */}
              <div
                className="rounded-2xl p-6 md:p-7"
                style={{
                  background: "rgba(5,8,14,0.7)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,212,255,0.12)",
                  boxShadow:
                    "0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {/* Step number badge */}
                <div
                  className="size-16 md:size-20 rounded-2xl flex items-center justify-center font-data text-2xl md:text-[28px] font-medium text-[#00d4ff] mb-6 relative"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(0,212,255,0.12) 0%, rgba(5,8,14,0.8) 100%)",
                    border: "1px solid rgba(0,212,255,0.25)",
                    boxShadow: "0 12px 40px -12px rgba(0,212,255,0.35)",
                  }}
                >
                  {step.n}
                  <span
                    className="absolute -bottom-2.5 -right-2.5 text-[#051018] font-data text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-[0.08em]"
                    style={{ background: "#00d4ff" }}
                  >
                    {step.label}
                  </span>
                </div>

                <h3 className="font-display text-xl md:text-[24px] font-semibold tracking-[-0.02em] mb-3 text-[#e8eef5]">
                  {step.title}
                </h3>
                <p className="text-[15px] text-[#b6c2d4] leading-[1.55] mb-4">
                  {step.desc}
                </p>

                {/* Code-style detail line */}
                <div
                  className="font-data text-xs rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(0,212,255,0.08)",
                  }}
                >
                  {step.code.split("→").map((part, j) => (
                    <span key={j}>
                      {j > 0 && <span className="text-[#38e0ff]"> → </span>}
                      {part.includes("accrue") ||
                      part.includes("principal") ||
                      part.includes("match_id") ? (
                        <span className="text-[#22c55e]">{part}</span>
                      ) : (
                        <span className="text-[#38e0ff]">{part}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
