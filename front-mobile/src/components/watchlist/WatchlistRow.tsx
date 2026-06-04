import { useNavigate } from "react-router";
import { ArrowDownRight, ArrowUpRight, Trash2 } from "lucide-react";
import type {WatchlistItem} from "../../types/watchlist.types.ts";

interface WatchlistRowProps {
    item: WatchlistItem;
    isFirst: boolean;
    onRemove: (item: WatchlistItem) => void;
}

export function WatchlistRow({ item, isFirst, onRemove }: WatchlistRowProps) {
    const navigate = useNavigate();
    const hasPrice = item.price !== null;
    const positive = (item.dailyChangePercent ?? 0) >= 0;

    return (
        <div
            data-testid="watchlist-row"
            className="grid gap-4 px-5 py-4 items-center hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            style={{
                gridTemplateColumns: "1fr 7rem 8rem 3rem",
                borderTop: isFirst ? "none" : "1px solid var(--border)",
            }}
            onClick={() => navigate(`/app/stock/${item.ticker}`)}
        >
            {/* Company */}
            <div>
        <span className="font-mono font-semibold text-[13px] text-[var(--primary)]">
          {item.ticker}
        </span>
                {item.name && (
                    <p className="text-xs text-[var(--text-muted)]">{item.name}</p>
                )}
            </div>

            {/* Price — AC01 + AC03 of US-06-03 */}
            <div className="text-right">
                {hasPrice ? (
                    <>
            <span data-testid="item-price" className="font-bold font-mono text-[var(--text)]">
              ${item.price!.toFixed(2)}
            </span>
                        {item.priceUpdatedAt && (
                            <p data-testid="item-price-date" className="text-[10px] text-[var(--text-faint)]">
                                {new Date(item.priceUpdatedAt).toLocaleString()}
                            </p>
                        )}
                    </>
                ) : (
                    <span data-testid="item-no-price" className="text-xs text-[var(--text-faint)]">
            Sin precio
          </span>
                )}
            </div>

            {/* Change — AC02 + AC04 of US-06-03 */}
            <div className="flex items-center justify-end gap-1">
                {hasPrice && item.dailyChangePercent !== null ? (
                    <>
                        {positive
                            ? <ArrowUpRight size={12} className="text-emerald-400" />
                            : <ArrowDownRight size={12} className="text-rose-400" />}
                        <span
                            data-testid="item-change"
                            className={`text-xs font-bold ${positive ? "text-emerald-400" : "text-rose-400"}`}
                        >
              {positive ? "+" : ""}{item.dailyChangePercent.toFixed(2)}%
            </span>
                    </>
                ) : (
                    <span className="text-xs text-[var(--text-faint)]">—</span>
                )}
            </div>

            {/* Remove */}
            <div className="flex justify-end">
                <button
                    data-testid="remove-btn"
                    aria-label={`Eliminar ${item.ticker}`}
                    onClick={(e) => { e.stopPropagation(); onRemove(item); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/15 transition-colors"
                >
                    <Trash2 size={13} className="text-rose-400" />
                </button>
            </div>
        </div>
    );
}