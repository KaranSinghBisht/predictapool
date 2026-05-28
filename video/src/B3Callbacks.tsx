import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, display, mono, radialGlow } from "./theme";

// B3Callbacks — 240 frames / 8s. Heading + three code-style cards.

const CALLBACKS = [
  {
    fn: "beforeAddLiquidity",
    desc: "only the hook manages pool liquidity",
  },
  {
    fn: "afterSwap",
    desc: "tracks every trade; fees accrue to the pool",
  },
  {
    fn: "claim(eventId)",
    desc: "splits principal from yield at settlement",
  },
] as const;

const CARD_W = 1280;
const CARD_H = 150;
const CARD_X = (1920 - CARD_W) / 2;
const FIRST_CARD_Y = 360;
const CARD_GAP = 30;

const CallbackCard: React.FC<{
  index: number;
  fn: string;
  desc: string;
  enterFrame: number;
}> = ({ index, fn, desc, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - enterFrame, config: { damping: 200 } });
  const opacity = interpolate(frame - enterFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty = interpolate(s, [0, 1], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const top = FIRST_CARD_Y + index * (CARD_H + CARD_GAP);
  return (
    <div
      style={{
        position: "absolute",
        left: CARD_X,
        top,
        width: CARD_W,
        height: CARD_H,
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "0 40px",
        backgroundColor: colors.cardSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        opacity,
        transform: `translateY(${ty}px)`,
        boxShadow: "0 10px 36px rgba(0,0,0,0.4)",
      }}
    >
      {/* index number */}
      <span
        style={{
          fontFamily: mono,
          fontSize: 24,
          color: colors.textMuted,
          width: 44,
          flexShrink: 0,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span
          style={{
            fontFamily: mono,
            fontSize: 38,
            fontWeight: 600,
            color: colors.cyan,
          }}
        >
          {fn}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: 24,
            color: colors.textSecondary,
          }}
        >
          {desc}
        </span>
      </div>
    </div>
  );
};

export const B3Callbacks: React.FC = () => {
  const frame = useCurrentFrame();

  const headingSpring = spring({
    fps: 30,
    frame,
    config: { damping: 200 },
  });
  const headingOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(headingSpring, [0, 1], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgBase }}>
      <AbsoluteFill style={{ background: radialGlow("50%", "30%", 0.13) }} />

      {/* Heading */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
        }}
      >
        <h2
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 64,
            margin: 0,
            color: colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          Three V4 hook callbacks
        </h2>
      </div>

      {CALLBACKS.map((c, i) => (
        <CallbackCard
          key={c.fn}
          index={i}
          fn={c.fn}
          desc={c.desc}
          enterFrame={26 + i * 18}
        />
      ))}
    </AbsoluteFill>
  );
};
