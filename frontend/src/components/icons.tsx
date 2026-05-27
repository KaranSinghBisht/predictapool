"use client";

import { useId } from "react";

export function PredictaPoolLogo({ size = 36 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="PredictaPool">
      <defs>
        <radialGradient id={`orb-${id}`} cx="0.45" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#7feeff" />
          <stop offset="55%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#005c70" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="34" r="28" stroke="#00d4ff" strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="32" cy="34" r="22" stroke="#00d4ff" strokeOpacity="0.32" strokeWidth="1" />
      <ellipse cx="32" cy="56" rx="16" ry="2.5" fill="#00d4ff" fillOpacity="0.25" />
      <circle cx="32" cy="30" r="16" fill={`url(#orb-${id})`} />
      <ellipse cx="26" cy="24" rx="5" ry="3" fill="#ffffff" fillOpacity="0.55" />
      <path d="M26 36 L32 24 L38 36 M32 24 L32 38" stroke="#051018" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlagAR({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="rounded-[18px]">
      <rect width="64" height="64" fill="#75aadb" />
      <rect y="22" width="64" height="20" fill="#ffffff" />
      <circle cx="32" cy="32" r="5.5" fill="#f6b13e" />
    </svg>
  );
}

export function FlagBR({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="rounded-[18px]">
      <rect width="64" height="64" fill="#1aa84a" />
      <polygon points="32,8 58,32 32,56 6,32" fill="#ffdf3a" />
      <circle cx="32" cy="32" r="9" fill="#013087" />
      <path d="M23 30 Q32 26 41 30" stroke="#fff" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

export function IconArrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8 H13 M9 4 L13 8 L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconExternal({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M4 2 H10 V8 M10 2 L4 8 M2 4 V10 H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="8" r="0.8" fill="currentColor" />
      <path d="M1.5 5.5 H11 V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5 L6 11 L12 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function UniswapMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <circle cx="6.5" cy="9" r="4" stroke="#ff5d9e" strokeWidth="1.6" />
      <circle cx="11.5" cy="9" r="4" stroke="#a673ff" strokeWidth="1.6" />
    </svg>
  );
}

export function XLayerMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 5.5 L12.5 12.5 M12.5 5.5 L5.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function FoundryMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M9 2 L15 5 V13 L9 16 L3 13 V5 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="2" fill="currentColor" />
    </svg>
  );
}
