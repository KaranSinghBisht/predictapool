"use client";

export function PredictaPoolLogo({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="PredictaPool"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        objectFit: "contain",
        borderRadius: size * 0.22,
      }}
    />
  );
}

export function FlagAR({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="rounded-[18px]"
    >
      <rect width="64" height="64" fill="#75aadb" />
      <rect y="22" width="64" height="20" fill="#ffffff" />
      <circle cx="32" cy="32" r="5.5" fill="#f6b13e" />
    </svg>
  );
}

export function FlagBR({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="rounded-[18px]"
    >
      <rect width="64" height="64" fill="#1aa84a" />
      <polygon points="32,8 58,32 32,56 6,32" fill="#ffdf3a" />
      <circle cx="32" cy="32" r="9" fill="#013087" />
      <path
        d="M23 30 Q32 26 41 30"
        stroke="#fff"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

export function IconArrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8 H13 M9 4 L13 8 L9 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconExternal({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path
        d="M4 2 H10 V8 M10 2 L4 8 M2 4 V10 H8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect
        x="1.5"
        y="3.5"
        width="13"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="11.5" cy="8" r="0.8" fill="currentColor" />
      <path
        d="M1.5 5.5 H11 V3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5 L6 11 L12 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M3 3 L11 11 M11 3 L3 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UniswapMark({ size = 18 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/uniswap-logo.png"
      alt="Uniswap"
      width={size}
      height={size}
      style={{ display: "inline-block", objectFit: "contain" }}
    />
  );
}

export function XLayerMark({ size = 18 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/x-layer.svg"
      alt="X Layer"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "invert(1)",
      }}
    />
  );
}

export function FoundryMark({ size = 18 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/foundry-logo.png"
      alt="Foundry"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "invert(1)",
      }}
    />
  );
}
