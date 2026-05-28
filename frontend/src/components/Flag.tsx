// Real country flags (flagcdn SVGs in /public/flags), keyed by team code.
const CODE_TO_CC: Record<string, string> = {
  ARG: "ar",
  BRA: "br",
  MEX: "mx",
  RSA: "za",
  MAR: "ma",
  NED: "nl",
  JPN: "jp",
  ENG: "gb-eng",
  CRO: "hr",
  USA: "us",
  TUR: "tr",
  FRA: "fr",
  NOR: "no",
  ESP: "es",
  URU: "uy",
  COL: "co",
  POR: "pt",
};

interface FlagProps {
  code: string;
  size?: number;
  /** Crop into a square tile (for badge containers) instead of a 4:3 rect. */
  square?: boolean;
  className?: string;
}

export function Flag({
  code,
  size = 28,
  square = false,
  className = "",
}: FlagProps) {
  const cc = CODE_TO_CC[code];
  const height = square ? size : Math.round((size * 3) / 4);
  // Proportional squircle so every flag has the same shape at any size.
  const borderRadius = square ? Math.round(size * 0.24) : 5;
  if (!cc) {
    // Neutral fallback (e.g. unknown code) — a muted tile, never an emoji.
    return (
      <span
        className={`inline-block ${className}`}
        style={{ width: size, height, borderRadius, background: "#1a2433" }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${cc}.svg`}
      alt={`${code} flag`}
      className={`object-cover ${className}`}
      style={{
        width: size,
        height,
        borderRadius,
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.5)",
      }}
    />
  );
}
