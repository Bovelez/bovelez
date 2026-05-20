import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { PnlText } from "../ui/PnlBadge";
import type { PortfolioItem } from "../../data/mockData";

const SECTOR_STYLES: Record<string, string> = {
  Tech:       "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  Crypto:     "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  Auto:       "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Finance:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Healthcare: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  Energy:     "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  Consumer:   "bg-pink-500/15 text-pink-300 border border-pink-500/30",
};

interface PortfolioRowProps {
  item: PortfolioItem;
  isFirst: boolean;
}

export function PortfolioRow({ item: p, isFirst }: PortfolioRowProps) {
  const navigate = useNavigate();

  const pnl = (p.currentPrice - p.avgPrice) * p.quantity;
  const pct = ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100;
  const sectorClass =
    SECTOR_STYLES[p.sector] ??
    "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]";

  return (
    <tr
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
          <div className="flex items-center gap-2">
            <p className="text-[var(--text)] text-[13px] font-semibold leading-tight">
              {p.name}{" "}
              <span className="font-mono text-[var(--text-muted)] font-bold">
                {p.ticker}
              </span>
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sectorClass}`}>
              {p.sector}
            </span>
          </div>
        </div>
      </td>

      {/* Price */}
      <td
        data-testid={`portfolio-row-${p.ticker}-price`}
        className="text-right px-3 font-mono text-[var(--text)]"
      >
        ${p.currentPrice.toFixed(2)}
      </td>

      {/* 24h % */}
      <td className="text-right px-3">
        <PnlText value={p.change24h} format="percent" data-testid={`portfolio-row-${p.ticker}-change24h`} />
      </td>

      {/* Quantity */}
      <td className="text-right px-3 font-mono text-[var(--text)]">{p.quantity}</td>

      {/* Invested */}
      <td className="text-right px-3 font-mono text-[var(--text)] font-semibold">
        ${(p.quantity * p.avgPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </td>

      {/* Avg price (PPC) */}
      <td className="text-right px-3 font-mono text-[var(--text-muted)]">
        ${p.avgPrice.toFixed(2)}
      </td>

      {/* Absolute P&L */}
      <td className="text-right px-3">
        <PnlText value={pnl} format="currency" data-testid={`portfolio-row-${p.ticker}-pnl`} />
      </td>

      {/* % G/P */}
      <td className="text-right px-3">
        <PnlText value={pct} format="percent" data-testid={`portfolio-row-${p.ticker}-pct`} />
      </td>

      <td className="px-5 text-right">
        <ChevronRight size={14} className="text-[var(--text-faint)] inline" />
      </td>
    </tr>
  );
}
