import type { StockPrice } from "../../types/prices.types";
import type { TransactionInput } from "../../types/transactions.types";

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
  return new Date().toISOString().slice(0, 10);
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
    Boolean(date) &&
    !isSubmitting
  );
}
