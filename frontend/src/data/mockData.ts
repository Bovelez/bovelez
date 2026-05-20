export interface PortfolioItem {
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  change24h: number; // percentage
  type: "accion" | "cripto";
}

export interface HistoryPoint {
  date: string;
  value: number;
}

export interface SectorSlice {
  name: string;
  value: number; // percentage
}

export const portfolio: PortfolioItem[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Tech",
    quantity: 12,
    avgPrice: 168.4,
    currentPrice: 189.3,
    change24h: 1.24,
    type: "accion",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    sector: "Tech",
    quantity: 8,
    avgPrice: 310.0,
    currentPrice: 422.6,
    change24h: 0.87,
    type: "accion",
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    sector: "Auto",
    quantity: 5,
    avgPrice: 230.0,
    currentPrice: 174.5,
    change24h: -2.13,
    type: "accion",
  },
  {
    ticker: "JPM",
    name: "JPMorgan Chase",
    sector: "Finance",
    quantity: 10,
    avgPrice: 195.0,
    currentPrice: 218.9,
    change24h: 0.45,
    type: "accion",
  },
  {
    ticker: "BTC",
    name: "Bitcoin",
    sector: "Crypto",
    quantity: 0.25,
    avgPrice: 58000,
    currentPrice: 67400,
    change24h: 3.52,
    type: "cripto",
  },
  {
    ticker: "ETH",
    name: "Ethereum",
    sector: "Crypto",
    quantity: 2,
    avgPrice: 2800,
    currentPrice: 3540,
    change24h: -1.08,
    type: "cripto",
  },
  {
    ticker: "UNH",
    name: "UnitedHealth Group",
    sector: "Healthcare",
    quantity: 3,
    avgPrice: 510.0,
    currentPrice: 542.0,
    change24h: 0.21,
    type: "accion",
  },
];

export const portfolioValueHistory: HistoryPoint[] = [
  { date: "Nov", value: 38400 },
  { date: "Dic", value: 40100 },
  { date: "Ene", value: 37800 },
  { date: "Feb", value: 41200 },
  { date: "Mar", value: 43500 },
  { date: "Abr", value: 42100 },
  { date: "May", value: 46800 },
];

export const sectorDistribution: SectorSlice[] = [
  { name: "Tech", value: 42 },
  { name: "Crypto", value: 28 },
  { name: "Finance", value: 16 },
  { name: "Healthcare", value: 14 },
];
