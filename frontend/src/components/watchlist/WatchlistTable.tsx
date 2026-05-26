import { Search } from "lucide-react";
import { WatchlistRow } from "./WatchlistRow";
import type {WatchlistItem} from "../../types/watchlist.types.ts";

interface WatchlistTableProps {
    items: WatchlistItem[];
    onRemove: (item: WatchlistItem) => void;
}

export function WatchlistTable({ items, onRemove }: WatchlistTableProps) {
    if (items.length === 0) {
        return (
            <div
                data-cy="watchlist-empty"
                className="flex flex-col items-center gap-3 py-20 text-center"
            >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                    <Search size={24} />
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)]">
                    Tu watchlist está vacía. Agregá un ticker para empezar.
                </p>
            </div>
        );
    }

    return (
        <div
            data-cy="watchlist-table"
            className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
        >
            {/* Column headers */}
            <div
                className="grid gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-[var(--bg-deep)] text-[var(--text-faint)]"
                style={{ gridTemplateColumns: "1fr 7rem 8rem 3rem" }}
            >
                <span>Empresa</span>
                <span className="text-right">Precio</span>
                <span className="text-right">Variación</span>
                <span />
            </div>

            {items.map((item, i) => (
                <WatchlistRow key={item.id} item={item} isFirst={i === 0} onRemove={onRemove} />
            ))}
        </div>
    );
}