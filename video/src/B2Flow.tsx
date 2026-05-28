import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, mono, radialGlow } from "./theme";

// B2Flow — 300 frames / 10s. Left-to-right mechanism flow with traveling dot.

// Layout in a 1920x1080 canvas.
const NODE_Y = 430; // vertical center of the main flow row
const NODES = [
  { label: "Deposit ppUSDC", x: 120, w: 300 },
  { label: "Becomes V4 liquidity", x: 470, w: 340 },
  { label: "Trades pay LP fees", x: 860, w: 330 },
  { label: "Match settles", x: 1240, w: 270 },
] as const;

// Outcome fork cards (to the right of the last node).
const FORK_X = 1560;
const FORK_W = 320;
const WINNER_Y = 300;
const LOSER_Y = 540;

const NodePill: React.FC<{
  label: string;
  x: number;
  w: number;
  enterFrame: number;
}> = ({ label, x, w, enterFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    fps,
    frame: frame - enterFrame,
    config: { damping: 200 },
  });
  const opacity = interpolate(frame - enterFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ty = interpolate(s, [0, 1], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: NODE_Y - 38,
        width: w,
        height: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.cardSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        opacity,
        transform: `translateY(${ty}px)`,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
      }}
    >
      <span
        style={{
          fontFamily: mono,
          fontSize: 24,
          color: colors.textPrimary,
          padding: "0 18px",
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
};

// A connector line that draws itself, with a glowing dot traveling along it.
const Connector: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  drawFrame: number;
  dotFrame: number;
  color?: string;
}> = ({ x1, y1, x2, y2, drawFrame, dotFrame, color = colors.cyan }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame - drawFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineX2 = x1 + (x2 - x1) * draw;
  const lineY2 = y1 + (y2 - y1) * draw;

  // Traveling dot progress along the full line.
  const t = interpolate(frame - dotFrame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotX = x1 + (x2 - x1) * t;
  const dotY = y1 + (y2 - y1) * t;
  const dotVisible = frame >= dotFrame && frame <= dotFrame + 26;

  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={lineX2}
        y2={lineY2}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.55}
      />
      {dotVisible && (
        <circle
          cx={dotX}
          cy={dotY}
          r={6}
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
    </>
  );
};

const OutcomeCard: React.FC<{
  title: string;
  y: number;
  enterFrame: number;
  accent: string;
  textColor: string;
  borderColor: string;
}> = ({ title, y, enterFrame, accent, textColor, borderColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    fps,
    frame: frame - enterFrame,
    config: { damping: 200 },
  });
  const opacity = interpolate(frame - enterFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tx = interpolate(s, [0, 1], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: FORK_X,
        top: y - 50,
        width: FORK_W,
        height: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.cardSurface,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 16,
        opacity,
        transform: `translateX(${tx}px)`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.35)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: accent,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      />
      <span
        style={{
          fontFamily: mono,
          fontSize: 22,
          color: textColor,
          padding: "0 22px",
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        {title}
      </span>
    </div>
  );
};

export const B2Flow: React.FC = () => {
  const frame = useCurrentFrame();

  // Heading entrance.
  const headingOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [0, 14], [-12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Right edges / centers used to wire connectors.
  const nodeRight = (i: number) => NODES[i].x + NODES[i].w;
  const lastNodeRight = nodeRight(3);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgBase }}>
      <AbsoluteFill style={{ background: radialGlow("55%", "45%", 0.13) }} />

      {/* Heading top-left */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 110,
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: mono,
            fontSize: 30,
            letterSpacing: 2,
            color: colors.cyanLight,
            textTransform: "uppercase",
          }}
        >
          How it works
        </span>
      </div>

      {/* Connector lines (SVG layer behind pills) */}
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {/* node 1 -> 2 -> 3 -> 4 (staggered draw + dot) */}
        <Connector
          x1={nodeRight(0)}
          y1={NODE_Y}
          x2={NODES[1].x}
          y2={NODE_Y}
          drawFrame={30}
          dotFrame={40}
        />
        <Connector
          x1={nodeRight(1)}
          y1={NODE_Y}
          x2={NODES[2].x}
          y2={NODE_Y}
          drawFrame={70}
          dotFrame={80}
        />
        <Connector
          x1={nodeRight(2)}
          y1={NODE_Y}
          x2={NODES[3].x}
          y2={NODE_Y}
          drawFrame={110}
          dotFrame={120}
        />
        {/* fork: last node -> winner (up) and loser (down) */}
        <Connector
          x1={lastNodeRight}
          y1={NODE_Y}
          x2={FORK_X}
          y2={WINNER_Y}
          drawFrame={150}
          dotFrame={162}
          color={colors.green}
        />
        <Connector
          x1={lastNodeRight}
          y1={NODE_Y}
          x2={FORK_X}
          y2={LOSER_Y}
          drawFrame={150}
          dotFrame={162}
          color={colors.textMuted}
        />
      </svg>

      {/* Flow node pills */}
      {NODES.map((n, i) => (
        <NodePill
          key={n.label}
          label={n.label}
          x={n.x}
          w={n.w}
          enterFrame={20 + i * 16}
        />
      ))}

      {/* Outcome fork cards */}
      <OutcomeCard
        title="Winner — principal + yield"
        y={WINNER_Y}
        enterFrame={176}
        accent={colors.green}
        textColor={colors.greenLight}
        borderColor="rgba(34,197,94,0.5)"
      />
      <OutcomeCard
        title="Loser — principal back"
        y={LOSER_Y}
        enterFrame={192}
        accent={colors.textMuted}
        textColor={colors.textSecondary}
        borderColor={colors.border}
      />
    </AbsoluteFill>
  );
};
