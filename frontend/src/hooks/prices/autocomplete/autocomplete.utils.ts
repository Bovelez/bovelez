import type { EdgarCompany } from "../../../types/edgar.types";

const DEFAULT_SUGGESTION_LIMIT = 8;
const NO_MATCH_RANK = 99;

function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distance = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) distance[row][0] = row;
  for (let col = 0; col < cols; col += 1) distance[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      distance[row][col] = Math.min(
        distance[row - 1][col] + 1,
        distance[row][col - 1] + 1,
        distance[row - 1][col - 1] + cost,
      );
    }
  }

  return distance[a.length][b.length];
}

function rankCompany(company: EdgarCompany, query: string): number {
  const ticker = company.ticker.toLowerCase();
  const name = company.name.toLowerCase();

  if (ticker === query) return 0;
  if (ticker.startsWith(query)) return 1;
  if (name.startsWith(query)) return 2;
  if (ticker.includes(query)) return 3;
  if (name.includes(query)) return 4;
  if (query.length >= 3 && editDistance(ticker, query) <= 2) return 5;
  return NO_MATCH_RANK;
}

function findSelectedCompany<TCompany extends EdgarCompany>(
  companies: TCompany[],
  selectedTicker?: string | null,
): TCompany | undefined {
  const normalizedSelectedTicker = selectedTicker?.trim().toUpperCase();
  if (!normalizedSelectedTicker) return undefined;
  return companies.find((company) => company.ticker === normalizedSelectedTicker);
}

export function getEdgarTickerSuggestions<TCompany extends EdgarCompany>({
  companies,
  limit = DEFAULT_SUGGESTION_LIMIT,
  rawQuery,
  selectedTicker,
}: {
  companies: TCompany[];
  limit?: number;
  rawQuery: string;
  selectedTicker?: string | null;
}): TCompany[] {
  const query = rawQuery.trim().toLowerCase();
  const selectedCompany = findSelectedCompany(companies, selectedTicker);

  if (selectedCompany && query === selectedCompany.ticker.toLowerCase()) {
    return [selectedCompany];
  }

  if (!query) return companies.slice(0, limit);

  return companies
    .filter((company) => rankCompany(company, query) < NO_MATCH_RANK)
    .sort((a, b) => {
      const rankDiff = rankCompany(a, query) - rankCompany(b, query);
      if (rankDiff !== 0) return rankDiff;
      return a.ticker.localeCompare(b.ticker);
    })
    .slice(0, limit);
}
