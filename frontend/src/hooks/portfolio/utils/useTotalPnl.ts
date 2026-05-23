import type {PortfolioPosition} from "../../../types/portfolio.types.ts";

export function useTotalPnl(positions: PortfolioPosition[]): number {
    return positions.reduce((sum, position) => sum + (position.pnl ?? 0), 0);
}
