import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, display, mono, radialGlow } from "./theme";

// B1Title — 120 frames / 4s. Centered title + tagline + LIVE micro-label.
export const B1Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title springs/fades in.
  const titleSpring = spring({
    fps,
    frame,
    config: { damping: 200 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline fades up ~12f later.
  const taglineSpring = spring({
    fps,
    frame: frame - 12,
    config: { damping: 200 },
  });
  const taglineY = interpolate(taglineSpring, [0, 1], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // LIVE micro-label fades in first.
  const labelOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [0, 14], [-10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing cyan dot.
  const pulse = Math.sin(frame / 8) * 0.5 + 0.5;
  const dotOpacity = interpolate(pulse, [0, 1], [0.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgBase }}>
      <AbsoluteFill style={{ background: radialGlow("50%", "42%", 0.16) }} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {/* LIVE micro-label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: colors.cyan,
              opacity: dotOpacity,
              boxShadow: `0 0 12px ${colors.cyan}`,
            }}
          />
          <span
            style={{
              fontFamily: mono,
              fontSize: 18,
              letterSpacing: 4,
              color: colors.textMuted,
              textTransform: "uppercase",
            }}
          >
            Live on X Layer Testnet
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 96,
            margin: 0,
            color: colors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            letterSpacing: -1,
          }}
        >
          PredictaPool
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: mono,
            fontSize: 28,
            margin: 0,
            marginTop: 26,
            color: colors.textSecondary,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Yield-backed predictions · Uniswap V4 hook · X Layer
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
