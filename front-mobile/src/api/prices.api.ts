import apiClient from "./apiClient";
import type {
  PriceBatchRun,
  StockPrice,
  UpdatePricesInput,
  UpdatePricesResponse,
} from "../types/prices.types";

export async function getStockPrices(): Promise<StockPrice[]> {
  const { data } = await apiClient.get<StockPrice[]>("/prices");
  return data;
}

export async function getStockPrice(ticker: string): Promise<StockPrice> {
  const { data } = await apiClient.get<StockPrice>(
    `/prices/${encodeURIComponent(ticker)}`,
  );
  return data;
}

export async function getLastPriceRun(): Promise<PriceBatchRun | null> {
  const { data } = await apiClient.get<PriceBatchRun | null>(
    "/prices/last-run",
  );
  return data;
}

export async function updateStockPrices(
  input: UpdatePricesInput,
): Promise<UpdatePricesResponse> {
  const { data } = await apiClient.post<UpdatePricesResponse>(
    "/prices/update",
    input,
  );
  return data;
}
