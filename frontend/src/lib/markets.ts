export type MarketStatus = "live" | "upcoming" | "settled";

export interface MarketMatch {
  id: string;
  teamA: string;
  teamACode: string;
  teamAColor: string;
  teamAFlag: string;
  teamB: string;
  teamBCode: string;
  teamBColor: string;
  teamBFlag: string;
  poolSize: string;
  topOutcomePct: string;
  topOutcomeLabel: string;
  status: MarketStatus;
  timeRemaining: string;
  featured?: boolean;
  isReal?: boolean;
  group?: string;
  venue?: string;
  kickoff?: string;
}

export const MARKETS: MarketMatch[] = [
  {
    id: "arg-bra",
    teamA: "Argentina",
    teamACode: "ARG",
    teamAColor: "#75aadb",
    teamAFlag: "\u{1F1E6}\u{1F1F7}",
    teamB: "Brazil",
    teamBCode: "BRA",
    teamBColor: "#ffdf3a",
    teamBFlag: "\u{1F1E7}\u{1F1F7}",
    poolSize: "Live on-chain",
    topOutcomePct: "Live",
    topOutcomeLabel: "Argentina",
    status: "live",
    timeRemaining: "On-chain",
    featured: true,
    isReal: true,
    group: "Live testnet showcase",
    venue: "MetLife Stadium, NJ",
    kickoff: "Open now · X Layer",
  },
  {
    id: "mex-rsa",
    teamA: "Mexico",
    teamACode: "MEX",
    teamAColor: "#006847",
    teamAFlag: "\u{1F1F2}\u{1F1FD}",
    teamB: "South Africa",
    teamBCode: "RSA",
    teamBColor: "#007749",
    teamBFlag: "\u{1F1FF}\u{1F1E6}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 11",
    group: "Group A · Opening match",
    venue: "Estadio Azteca, Mexico City",
    kickoff: "Jun 11 · 15:00 ET",
  },
  {
    id: "bra-mar",
    teamA: "Brazil",
    teamACode: "BRA",
    teamAColor: "#ffdf3a",
    teamAFlag: "\u{1F1E7}\u{1F1F7}",
    teamB: "Morocco",
    teamBCode: "MAR",
    teamBColor: "#c1272d",
    teamBFlag: "\u{1F1F2}\u{1F1E6}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 13",
    group: "Group C",
    venue: "MetLife Stadium, NJ",
    kickoff: "Jun 13 · 18:00 ET",
  },
  {
    id: "ned-jpn",
    teamA: "Netherlands",
    teamACode: "NED",
    teamAColor: "#ff6600",
    teamAFlag: "\u{1F1F3}\u{1F1F1}",
    teamB: "Japan",
    teamBCode: "JPN",
    teamBColor: "#bc002d",
    teamBFlag: "\u{1F1EF}\u{1F1F5}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 14",
    group: "Group F",
    venue: "AT&T Stadium, Dallas",
    kickoff: "Jun 14 · 16:00 ET",
  },
  {
    id: "eng-cro",
    teamA: "England",
    teamACode: "ENG",
    teamAColor: "#ffffff",
    teamAFlag:
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    teamB: "Croatia",
    teamBCode: "CRO",
    teamBColor: "#ff0000",
    teamBFlag: "\u{1F1ED}\u{1F1F7}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 17",
    group: "Group L",
    venue: "AT&T Stadium, Dallas",
    kickoff: "Jun 17 · 16:00 ET",
  },
  {
    id: "usa-tur",
    teamA: "USA",
    teamACode: "USA",
    teamAColor: "#3c3b6e",
    teamAFlag: "\u{1F1FA}\u{1F1F8}",
    teamB: "Türkiye",
    teamBCode: "TUR",
    teamBColor: "#e30a17",
    teamBFlag: "\u{1F1F9}\u{1F1F7}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 25",
    group: "Group D · Host nation",
    venue: "SoFi Stadium, LA",
    kickoff: "Jun 25 · 22:00 ET",
  },
  {
    id: "fra-nor",
    teamA: "France",
    teamACode: "FRA",
    teamAColor: "#002654",
    teamAFlag: "\u{1F1EB}\u{1F1F7}",
    teamB: "Norway",
    teamBCode: "NOR",
    teamBColor: "#ba0c2f",
    teamBFlag: "\u{1F1F3}\u{1F1F4}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 26",
    group: "Group I",
    venue: "Gillette Stadium, Boston",
    kickoff: "Jun 26 · 15:00 ET",
  },
  {
    id: "esp-uru",
    teamA: "Spain",
    teamACode: "ESP",
    teamAColor: "#c60b1e",
    teamAFlag: "\u{1F1EA}\u{1F1F8}",
    teamB: "Uruguay",
    teamBCode: "URU",
    teamBColor: "#001489",
    teamBFlag: "\u{1F1FA}\u{1F1FE}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 26",
    group: "Group H",
    venue: "Estadio Akron, Guadalajara",
    kickoff: "Jun 26 · 20:00 ET",
  },
  {
    id: "por-col",
    teamA: "Portugal",
    teamACode: "POR",
    teamAColor: "#006847",
    teamAFlag: "\u{1F1F5}\u{1F1F9}",
    teamB: "Colombia",
    teamBCode: "COL",
    teamBColor: "#fcd116",
    teamBFlag: "\u{1F1E8}\u{1F1F4}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 27",
    group: "Group K",
    venue: "Hard Rock Stadium, Miami",
    kickoff: "Jun 27 · 19:30 ET",
  },
];

export function getMarketById(id: string): MarketMatch | undefined {
  return MARKETS.find((m) => m.id === id);
}
