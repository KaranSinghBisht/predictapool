import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, display, mono, radialGlow } from "./theme";

// B4End — 150 frames / 5s. Closing CTA.
export const B4End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline springs/fades in.
  const headlineSpring = spring({ fps, frame, config: { damping: 200 } });
  const headlineY = interpolate(headlineSpring, [0, 1], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL fades up later.
  const urlOpacity = interpolate(frame, [22, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlY = interpolate(frame, [22, 40], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Muted line fades in last.
  const subOpacity = interpolate(frame, [38, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing dot.
  const pulse = Math.sin(frame / 8) * 0.5 + 0.5;
  const dotOpacity = interpolate(pulse, [0, 1], [0.35, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgBase }}>
      <AbsoluteFill style={{ background: radialGlow("50%", "46%", 0.16) }} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 84,
            margin: 0,
            color: colors.textPrimary,
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            textAlign: "center",
            letterSpacing: -1,
            lineHeight: 1.15,
          }}
        >
          Predict the <span style={{ color: colors.green }}>match.</span>
          <br />
          Earn real <span style={{ color: colors.cyan }}>yield.</span>
        </h1>

        {/* URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 48,
            opacity: urlOpacity,
            transform: `translateY(${urlY}px)`,
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
              fontSize: 34,
              color: colors.cyan,
            }}
          >
            predictapool.vercel.app
          </span>
        </div>

        {/* Muted footer line */}
        <p
          style={{
            fontFamily: mono,
            fontSize: 22,
            margin: 0,
            marginTop: 22,
            color: colors.textMuted,
            opacity: subOpacity,
            letterSpacing: 1,
          }}
        >
          Live on X Layer · #HookTheFuture
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
