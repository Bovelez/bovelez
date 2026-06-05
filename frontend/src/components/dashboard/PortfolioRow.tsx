import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { PnlText } from "../ui/PnlBadge";
import type { PortfolioPosition } from "../../types/portfolio.types";

interface PortfolioRowProps {
  item: PortfolioPosition;
  dailyChangePercent: number | null;
  isFirst: boolean;
}

export function PortfolioRow({ item: p, dailyChangePercent, isFirst }: PortfolioRowProps) {
  const navigate = useNavigate();

  return (
    <tr
      data-cy="portfolio-row"
      data-testid={`portfolio-row-${p.ticker}`}
      onClick={() => navigate(`/app/stock/${p.ticker}`)}
      className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
      style={{ borderTop: isFirst ? "none" : "1px solid var(--border)" }}
    >
      {/* Name */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] font-bold text-[var(--primary)]">
            {p.ticker.slice(0, 2)}
          </div>
          <p data-cy="portfolio-row-ticker" className="text-[var(--text)] text-[13px] font-semibold leading-tight font-mono">
            {p.ticker}
          </p>
        </div>
      </td>

      {/* Price */}
      <td
        data-cy="portfolio-row-price"
        data-testid={`portfolio-row-${p.ticker}-price`}
        className="text-right px-3 font-mono text-[var(--text)]"
      >
        {p.currentPrice != null ? `$${p.currentPrice.toFixed(2)}` : "—"}
      </td>

      {/* 24h % */}
      <td data-cy="portfolio-row-change24h" className="text-right px-3">
        {dailyChangePercent != null ? (
          <PnlText value={dailyChangePercent} format="percent" data-testid={`portfolio-row-${p.ticker}-change24h`} />
        ) : (
          <span className="text-[var(--text-faint)]">—</span>
        )}
      </td>

      {/* Quantity */}
      <td data-cy="portfolio-row-quantity" className="text-right px-3 font-mono text-[var(--text)]">{p.quantity}</td>

      {/* Invested */}
      <td data-cy="portfolio-row-invested" className="text-right px-3 font-mono text-[var(--text)] font-semibold">
        ${(p.quantity * p.avgCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </td>

      {/* Avg price (PPC) */}
      <td data-cy="portfolio-row-avg-cost" className="text-right px-3 font-mono text-[var(--text-muted)]">
        ${p.avgCost.toFixed(2)}
      </td>

      {/* Absolute P&L */}
      <td data-cy="portfolio-row-pnl" className="text-right px-3">
        {p.pnl != null ? (
          <PnlText value={p.pnl} format="currency" data-testid={`portfolio-row-${p.ticker}-pnl`} />
        ) : (
          <span className="text-[var(--text-faint)]">—</span>
        )}
      </td>

      {/* % G/P */}
      <td data-cy="portfolio-row-pnl-percent" className="text-right px-3">
        {p.pnlPercent != null ? (
          <PnlText value={p.pnlPercent} format="percent" data-testid={`portfolio-row-${p.ticker}-pct`} />
        ) : (
          <span className="text-[var(--text-faint)]">—</span>
        )}
      </td>

      <td className="px-5 text-right">
        <ChevronRight size={14} className="text-[var(--text-faint)] inline" />
      </td>
    </tr>
  );
}
