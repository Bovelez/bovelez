import type { StockPrice } from "../../../types/prices.types";
import type {Transaction, TransactionInput} from "../../../types/transactions.types";

export function transactionErrorLabel(error: unknown): string | undefined {
  if (!error) return undefined;

  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string | string[] } };
      }
    ).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (message) return message;
  }

  if (error instanceof Error) return error.message;
  return "No se pudo registrar la operación.";
}

export function todayInputValue(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isTransactionDateAllowed(date: string): boolean {
  return date === todayInputValue();
}

export function buildTransactionInput({
  date,
  quantity,
  selectedPrice,
}: {
  date: string;
  quantity: string;
  selectedPrice: StockPrice | null;
}): TransactionInput | null {
  const parsedQuantity = Number(quantity);

  if (!selectedPrice || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return null;
  }

  return {
    ticker: selectedPrice.ticker,
    quantity: parsedQuantity,
    date,
  };
}

export function canSubmitTransaction({
  date,
  isSubmitting,
  quantity,
  selectedPrice,
}: {
  date: string;
  isSubmitting: boolean;
  quantity: string;
  selectedPrice: StockPrice | null;
}): boolean {
  const parsedQuantity = Number(quantity);

  return (
    Boolean(selectedPrice) &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0 &&
    isTransactionDateAllowed(date) &&
    !isSubmitting
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function byLatestTransaction(a: Transaction, b: Transaction): number {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}