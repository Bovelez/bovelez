import apiClient from "./apiClient";
import type { Portfolio } from "../types/portfolio.types";

export async function getPortfolio(): Promise<Portfolio> {
  const { data } = await apiClient.get<Portfolio>("/portfolio");
  return data;
}
