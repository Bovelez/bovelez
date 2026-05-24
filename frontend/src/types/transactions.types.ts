import type {StockPrice} from "./prices.types.ts";
import type {PortfolioPosition} from "./portfolio.types.ts";

export type TransactionType = "BUY" | "SELL";

export type Transaction = {
  id: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  createdAt: string;
};

export type TransactionInput = {
  ticker: string;
  quantity: number;
  date: string;
};

export type TransactionPanelProps = {
  selectedPrice: StockPrice | null;
  lastPriceRunFinishedAt?: string | null;
};

export type TickerTransactionsDialogProps = {
  open: boolean;
  position: PortfolioPosition | null;
  onOpenChange: (open: boolean) => void;
};