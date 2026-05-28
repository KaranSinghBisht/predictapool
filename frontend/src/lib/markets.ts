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
    group: "Group B",
    venue: "MetLife Stadium, NJ",
    kickoff: "Jul 12 · 20:00 ET",
  },
  {
    id: "usa-mex",
    teamA: "USA",
    teamACode: "USA",
    teamAColor: "#3c3b6e",
    teamAFlag: "\u{1F1FA}\u{1F1F8}",
    teamB: "Mexico",
    teamBCode: "MEX",
    teamBColor: "#006847",
    teamBFlag: "\u{1F1F2}\u{1F1FD}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 20",
    group: "Group A",
    venue: "SoFi Stadium, LA",
    kickoff: "Jun 20 · 18:00 ET",
  },
  {
    id: "ger-fra",
    teamA: "Germany",
    teamACode: "GER",
    teamAColor: "#ffcc00",
    teamAFlag: "\u{1F1E9}\u{1F1EA}",
    teamB: "France",
    teamBCode: "FRA",
    teamBColor: "#002654",
    teamBFlag: "\u{1F1EB}\u{1F1F7}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 23",
    group: "Group C",
    venue: "AT&T Stadium, TX",
    kickoff: "Jun 23 · 15:00 ET",
  },
  {
    id: "eng-spa",
    teamA: "England",
    teamACode: "ENG",
    teamAColor: "#ffffff",
    teamAFlag:
      "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    teamB: "Spain",
    teamBCode: "ESP",
    teamBColor: "#c60b1e",
    teamBFlag: "\u{1F1EA}\u{1F1F8}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 26",
    group: "Group D",
    venue: "Hard Rock Stadium, FL",
    kickoff: "Jun 26 · 20:00 ET",
  },
  {
    id: "por-ned",
    teamA: "Portugal",
    teamACode: "POR",
    teamAColor: "#006847",
    teamAFlag: "\u{1F1F5}\u{1F1F9}",
    teamB: "Netherlands",
    teamBCode: "NED",
    teamBColor: "#ff6600",
    teamBFlag: "\u{1F1F3}\u{1F1F1}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 28",
    group: "Group E",
    venue: "Lincoln Financial, PA",
    kickoff: "Jun 28 · 12:00 ET",
  },
  {
    id: "jpn-kor",
    teamA: "Japan",
    teamACode: "JPN",
    teamAColor: "#bc002d",
    teamAFlag: "\u{1F1EF}\u{1F1F5}",
    teamB: "South Korea",
    teamBCode: "KOR",
    teamBColor: "#003478",
    teamBFlag: "\u{1F1F0}\u{1F1F7}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 30",
    group: "Group F",
    venue: "Lumen Field, WA",
    kickoff: "Jun 30 · 18:00 ET",
  },
  {
    id: "ita-cro",
    teamA: "Italy",
    teamACode: "ITA",
    teamAColor: "#008c45",
    teamAFlag: "\u{1F1EE}\u{1F1F9}",
    teamB: "Croatia",
    teamBCode: "CRO",
    teamBColor: "#ff0000",
    teamBFlag: "\u{1F1ED}\u{1F1F7}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 15",
    group: "Group G",
    venue: "BMO Stadium, CAN",
    kickoff: "Jun 15 · 14:00 ET",
  },
  {
    id: "uru-col",
    teamA: "Uruguay",
    teamACode: "URU",
    teamAColor: "#001489",
    teamAFlag: "\u{1F1FA}\u{1F1FE}",
    teamB: "Colombia",
    teamBCode: "COL",
    teamBColor: "#fcd116",
    teamBFlag: "\u{1F1E8}\u{1F1F4}",
    poolSize: "Opens soon",
    topOutcomePct: "—",
    topOutcomeLabel: "",
    status: "upcoming",
    timeRemaining: "Jun 16",
    group: "Group H",
    venue: "BMO Field, CAN",
    kickoff: "Jun 16 · 12:00 ET",
  },
];

export function getMarketById(id: string): MarketMatch | undefined {
  return MARKETS.find((m) => m.id === id);
}
