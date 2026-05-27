"use client";

const FLOW_STEPS = [
  {
    id: "user",
    label: "User",
    fn: "predict(matchId, outcome, amount)",
    color: "green" as const,
    desc: "Initiates prediction",
  },
  {
    id: "pool",
    label: "PoolManager",
    fn: "unlock()",
    color: "cyan" as const,
    desc: "Enters transient accounting",
  },
  {
    id: "callback",
    label: "unlockCallback",
    fn: "ACTION_ADD_LIQUIDITY",
    color: "cyan" as const,
    desc: "Hook routes deposit",
  },
  {
    id: "lp",
    label: "LP Position",
    fn: "modifyLiquidity()",
    color: "cyan" as const,
    desc: "Creates concentrated LP",
  },
  {
    id: "yield",
    label: "Yield Accrual",
    fn: "afterSwap()",
    color: "cyan" as const,
    desc: "Swap fees drip to vault",
  },
  {
    id: "settle",
    label: "Settlement",
    fn: "settleEvent()",
    color: "cyan" as const,
    desc: "Oracle resolves outcome",
  },
  {
    id: "claim",
    label: "Claim",
    fn: "claim() → principal + yield",
    color: "green" as const,
    desc: "User withdraws funds",
  },
];

function StepBox({
  step,
  index,
}: {
  step: (typeof FLOW_STEPS)[number];
  index: number;
}) {
  const isCyan = step.color === "cyan";
  const borderColor = isCyan
    ? "rgba(0,212,255,0.3)"
    : "rgba(34,197,94,0.3)";
  const glowColor = isCyan
    ? "rgba(0,212,255,0.12)"
    : "rgba(34,197,94,0.12)";
  const accentText = isCyan ? "#38e0ff" : "#22c55e";
  const dotColor = isCyan ? "#00d4ff" : "#16a34a";

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full rounded-xl px-5 py-4"
        style={{
          background: `linear-gradient(160deg, ${glowColor} 0%, #0a1019 100%)`,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Step number */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="size-5 rounded-full flex items-center justify-center font-data text-[10px] font-semibold"
            style={{
              background: dotColor,
              color: "#051018",
            }}
          >
            {index + 1}
          </span>
          <span
            className="font-display text-sm font-semibold"
            style={{ color: accentText }}
          >
            {step.label}
          </span>
        </div>

        {/* Function name */}
        <div
          className="font-data text-xs leading-relaxed mb-1"
          style={{ color: accentText }}
        >
          {step.fn}
        </div>

        {/* Description */}
        <div className="font-data text-[11px] text-[#6b7a8f] leading-snug">
          {step.desc}
        </div>
      </div>
    </div>
  );
}

function Arrow({ direction }: { direction: "down" | "right" }) {
  if (direction === "down") {
    return (
      <div className="flex justify-center py-1.5">
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <path
            d="M8 0 V18 M3 14 L8 20 L13 14"
            stroke="#00d4ff"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.5"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center px-1">
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <path
          d="M0 8 H24 M20 3 L27 8 L20 13"
          stroke="#00d4ff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
      </svg>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <section className="py-36 relative" id="architecture">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 60%, rgba(0,212,255,0.07), transparent 55%)",
        }}
      />
      <div className="relative max-w-[1320px] mx-auto px-[60px]">
        {/* Header */}
        <div className="max-w-[760px] mb-14">
          <span className="font-data text-xs text-[#38e0ff] uppercase tracking-[0.18em]">
            Architecture
          </span>
          <h2 className="font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] mt-4 mb-4 text-[#e8eef5]">
            Hook callback flow.
          </h2>
          <p className="text-lg text-[#b6c2d4] leading-[1.55]">
            Every prediction follows a deterministic path through
            Uniswap&nbsp;V4&apos;s unlock pattern &mdash; from deposit to
            settlement, fully on&#8209;chain.
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-8">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
              User-facing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }}
            />
            <span className="font-data text-[11px] text-[#6b7a8f] uppercase tracking-[0.1em]">
              Hook / DeFi
            </span>
          </div>
        </div>

        {/* Flow diagram -- vertical on mobile, horizontal on desktop */}

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:flex items-stretch">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.id} className="contents">
              <div className="flex-1 min-w-0">
                <StepBox step={step} index={i} />
              </div>
              {i < FLOW_STEPS.length - 1 && <Arrow direction="right" />}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="lg:hidden flex flex-col max-w-sm mx-auto">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.id}>
              <StepBox step={step} index={i} />
              {i < FLOW_STEPS.length - 1 && <Arrow direction="down" />}
            </div>
          ))}
        </div>

        {/* Footnote */}
        <div className="mt-10 pt-6 border-t border-[rgba(232,238,245,0.08)]">
          <p className="font-data text-xs text-[#6b7a8f]">
            All contract calls are non-custodial. The hook never holds user
            funds outside the Uniswap V4 singleton.
          </p>
        </div>
      </div>
    </section>
  );
}
