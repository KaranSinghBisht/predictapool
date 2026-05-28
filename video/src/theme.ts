// Brand system for PredictaPool video clips.
// Single source of truth for colors and fonts used across all compositions.

import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// Load only the weights/subset actually used so renders stay fast
// (avoids loading every weight + subset, which triggers ~96 network requests).
const { fontFamily: spaceGroteskFamily } = loadSpaceGrotesk("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
const { fontFamily: jetBrainsMonoFamily } = loadJetBrainsMono("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

export const display = spaceGroteskFamily;
export const mono = jetBrainsMonoFamily;

export const colors = {
  bgBase: "#05080e",
  cardSurface: "#0a1019",
  cardSurfaceFaint: "rgba(255,255,255,0.02)",
  cyan: "#00d4ff",
  cyanLight: "#38e0ff",
  green: "#22c55e",
  greenLight: "#6ee7a0",
  yellow: "#ffdf3a",
  textPrimary: "#e8eef5",
  textSecondary: "#b6c2d4",
  textMuted: "#6b7a8f",
  border: "rgba(232,238,245,0.08)",
} as const;

// A faint radial cyan glow background so frames are never dead-flat.
export const radialGlow = (x = "50%", y = "45%", intensity = 0.14): string =>
  `radial-gradient(circle at ${x} ${y}, rgba(0,212,255,${intensity}) 0%, rgba(0,212,255,0) 55%)`;
