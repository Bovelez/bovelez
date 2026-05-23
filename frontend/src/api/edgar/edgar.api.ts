import apiClient from "../apiClient";
import type {
  EdgarCompany,
  EdgarCompanyRecord,
  EdgarFiling,
  EdgarMetrics,
  EdgarSearchResult,
} from "../../types/edgar.types";

export async function getEdgarCompanies(): Promise<EdgarCompany[]> {
  const { data } = await apiClient.get<EdgarCompany[]>("/edgar/companies");
  return data;
}

export async function searchEdgarCompanies(
  query: string,
): Promise<EdgarSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const { data } = await apiClient.get<EdgarSearchResult[]>("/edgar/search", {
    params: { q: normalizedQuery },
  });
  return data;
}

export async function getEdgarCompany(
  ticker: string,
): Promise<EdgarCompanyRecord> {
  const { data } = await apiClient.get<EdgarCompanyRecord>(
    `/edgar/companies/${encodeURIComponent(ticker)}`,
  );
  return data;
}

export async function syncEdgarCompany(
  ticker: string,
): Promise<EdgarCompanyRecord> {
  const { data } = await apiClient.patch<EdgarCompanyRecord>(
    `/edgar/companies/${encodeURIComponent(ticker)}/sync`,
  );
  return data;
}

export async function getEdgarCompanyFilings(
  ticker: string,
): Promise<EdgarFiling[]> {
  const { data } = await apiClient.get<EdgarFiling[]>(
    `/edgar/companies/${encodeURIComponent(ticker)}/filings`,
  );
  return data;
}

export async function getEdgarCompanyMetrics(
  ticker: string,
  quarters = 4,
): Promise<EdgarMetrics> {
  const { data } = await apiClient.get<EdgarMetrics>(
    `/edgar/companies/${encodeURIComponent(ticker)}/metrics`,
    { params: { quarters } },
  );
  return data;
}
