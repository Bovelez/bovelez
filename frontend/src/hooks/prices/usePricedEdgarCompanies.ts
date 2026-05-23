import type { EdgarCompany } from "../../types/edgar.types";
import type { PricedEdgarCompany } from "../../types/prices.types";
import { useStockPrices } from "./useStockPrices";

export function usePricedEdgarCompanies(companies: EdgarCompany[]) {
  const pricesQuery = useStockPrices();
  const pricesByTicker = new Map(
    (pricesQuery.data ?? []).map((price) => [
      price.ticker.trim().toUpperCase(),
      price,
    ]),
  );

  return {
    ...pricesQuery,
    data: companies.map((company): PricedEdgarCompany => {
      const ticker = company.ticker.trim().toUpperCase();
      const price = pricesByTicker.get(ticker);

      return {
        ...company,
        ticker,
        price: price?.price ?? null,
        priceUpdatedAt: price?.updatedAt ?? null,
      };
    }),
  };
}
