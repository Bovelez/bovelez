import type {PortfolioPosition} from "../../../types/portfolio.types.ts";
import {useInvestedValue} from "./useInvestedValue.ts";
import {useTotalPnl} from "./useTotalPnl.ts";


export function useTotalPnlPercent(positions: PortfolioPosition[]): number {
    const invested = useInvestedValue(positions);
    if (invested === 0) return 0;
    return (useTotalPnl(positions) / invested) * 100;
}