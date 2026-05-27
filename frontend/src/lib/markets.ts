export type MarketStatus = "live" | "upcoming" | "settled";

export interface MarketMatch {
  id: string;
  teamA: string;
  teamACode: string;
  teamAColor: string;
  teamB: string;
  teamBCode: string;
  teamBColor: string;
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
    teamA: "Argentina", teamACode: "ARG", teamAColor: "#75aadb",
    teamB: "Brazil", teamBCode: "BRA", teamBColor: "#ffdf3a",
    poolSize: "Live on-chain", topOutcomePct: "Live", topOutcomeLabel: "Argentina",
    status: "live", timeRemaining: "On-chain", featured: true, isReal: true,
    group: "Group B", venue: "MetLife Stadium, NJ", kickoff: "Jul 12 · 20:00 ET",
  },
  {
    id: "usa-mex",
    teamA: "USA", teamACode: "USA", teamAColor: "#3c3b6e",
    teamB: "Mexico", teamBCode: "MEX", teamBColor: "#006847",
    poolSize: "$812k", topOutcomePct: "44.2%", topOutcomeLabel: "USA",
    status: "upcoming", timeRemaining: "12d 8h",
    group: "Group A", venue: "SoFi Stadium, LA", kickoff: "Jun 20 · 18:00 ET",
  },
  {
    id: "ger-fra",
    teamA: "Germany", teamACode: "GER", teamAColor: "#ffcc00",
    teamB: "France", teamBCode: "FRA", teamBColor: "#002654",
    poolSize: "$654k", topOutcomePct: "41.8%", topOutcomeLabel: "France",
    status: "upcoming", timeRemaining: "15d 3h",
    group: "Group C", venue: "AT&T Stadium, TX", kickoff: "Jun 23 · 15:00 ET",
  },
  {
    id: "eng-spa",
    teamA: "England", teamACode: "ENG", teamAColor: "#ffffff",
    teamB: "Spain", teamBCode: "ESP", teamBColor: "#c60b1e",
    poolSize: "$521k", topOutcomePct: "38.5%", topOutcomeLabel: "Spain",
    status: "upcoming", timeRemaining: "18d 6h",
    group: "Group D", venue: "Hard Rock Stadium, FL", kickoff: "Jun 26 · 20:00 ET",
  },
  {
    id: "por-ned",
    teamA: "Portugal", teamACode: "POR", teamAColor: "#006847",
    teamB: "Netherlands", teamBCode: "NED", teamBColor: "#ff6600",
    poolSize: "$389k", topOutcomePct: "42.1%", topOutcomeLabel: "Portugal",
    status: "upcoming", timeRemaining: "20d 1h",
    group: "Group E", venue: "Lincoln Financial, PA", kickoff: "Jun 28 · 12:00 ET",
  },
  {
    id: "jpn-kor",
    teamA: "Japan", teamACode: "JPN", teamAColor: "#bc002d",
    teamB: "South Korea", teamBCode: "KOR", teamBColor: "#003478",
    poolSize: "$245k", topOutcomePct: "46.3%", topOutcomeLabel: "Japan",
    status: "upcoming", timeRemaining: "22d 5h",
    group: "Group F", venue: "Lumen Field, WA", kickoff: "Jun 30 · 18:00 ET",
  },
  {
    id: "ita-cro",
    teamA: "Italy", teamACode: "ITA", teamAColor: "#008c45",
    teamB: "Croatia", teamBCode: "CRO", teamBColor: "#ff0000",
    poolSize: "$412k", topOutcomePct: "52.1%", topOutcomeLabel: "Italy",
    status: "settled", timeRemaining: "Settled",
    group: "Group G", venue: "BMO Stadium, CAN", kickoff: "Jun 15 · 14:00 ET",
  },
  {
    id: "uru-col",
    teamA: "Uruguay", teamACode: "URU", teamAColor: "#001489",
    teamB: "Colombia", teamBCode: "COL", teamBColor: "#fcd116",
    poolSize: "$198k", topOutcomePct: "48.7%", topOutcomeLabel: "Colombia",
    status: "settled", timeRemaining: "Settled",
    group: "Group H", venue: "BMO Field, CAN", kickoff: "Jun 16 · 12:00 ET",
  },
];

export function getMarketById(id: string): MarketMatch | undefined {
  return MARKETS.find(m => m.id === id);
}
