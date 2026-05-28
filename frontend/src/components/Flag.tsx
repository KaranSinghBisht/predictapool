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

export function Flag({ code, size = 28, square = false, className = "" }: FlagProps) {
  const cc = CODE_TO_CC[code];
  const height = square ? size : Math.round((size * 3) / 4);
  if (!cc) {
    // Neutral fallback (e.g. unknown code) — a muted tile, never an emoji.
    return (
      <span
        className={`inline-block rounded-[5px] bg-[#1a2433] ${className}`}
        style={{ width: size, height }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${cc}.svg`}
      alt={`${code} flag`}
      className={`object-cover rounded-[5px] ${className}`}
      style={{
        width: size,
        height,
        boxShadow: "0 1px 4px rgba(0,0,0,0.45)",
      }}
    />
  );
}
