import { getEdgarTickerSuggestions } from "./autocomplete.utils";
import type { EdgarCompany } from "../../../types/edgar.types";

export function useEdgarTickerAutocomplete<TCompany extends EdgarCompany>(
  companies: TCompany[],
  rawQuery: string,
  selectedTicker?: string | null,
) {
  return {
    suggestions: getEdgarTickerSuggestions({
      companies,
      rawQuery,
      selectedTicker,
    }),
  };
}
