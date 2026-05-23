import type {PortfolioPosition} from "../../../types/portfolio.types.ts";

export function useInvestedValue(positions: PortfolioPosition[]): number {
    return positions.reduce(
        (sum, position) => sum + position.avgCost * position.quantity,
        0,
    );
}