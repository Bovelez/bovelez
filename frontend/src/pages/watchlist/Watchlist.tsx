import { useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useWatchlist } from "../../hooks/watchlist/useWatchlist";
import { useRemoveWatchlistItem } from "../../hooks/watchlist/useRemoveWatchlistItem";
import { useCompareMetrics } from "../../hooks/watchlist/useCompareMetrics";
import type {WatchlistItem} from "../../types/watchlist.types";
import {addWatchlistErrorLabel, type WatchlistTab} from "./watchlist.utils.ts";
import {useAddWatchlistItem} from "../../hooks/watchlist/useAddWatchlist.ts";
import {WatchlistHeader} from "../../components/watchlist/WatchlistHeader.tsx";
import {WatchlistCompare} from "../../components/watchlist/WatchlistCompare.tsx";
import {WatchlistTable} from "../../components/watchlist/WatchlistTable.tsx";
import {WatchlistAddForm} from "../../components/watchlist/WatchListAddForm.tsx";
import {TabGroup} from "../../components/ui/TabGroup.tsx";
import {WatchlistRemoveDialog} from "../../components/watchlist/WatchlistRemoveDialog.tsx";
import {useStockPrices} from "../../hooks/prices/useStockPrices.ts";

const TABS: { key: WatchlistTab; label: string }[] = [
    { key: "ver",      label: "Lista" },
    { key: "comparar", label: "Comparar" },
];

export default function Watchlist() {
    const [tab, setTab] = useState<WatchlistTab>("ver");
    const [addSuccess, setAddSuccess] = useState(false);
    const [pendingRemove, setPendingRemove] = useState<WatchlistItem | null>(null);
    const [compareSelected, setCompareSelected] = useState<string[]>([]);

    const watchlist      = useWatchlist();
    const addItem        = useAddWatchlistItem();
    const removeItem     = useRemoveWatchlistItem();
    const compareMetrics = useCompareMetrics();
    const pricesQuery = useStockPrices();

    const items = watchlist.data ?? [];

    const handleAdd = async (ticker: string) => {
        setAddSuccess(false);
        addItem.reset();
        try {
            await addItem.mutateAsync(ticker.trim().toUpperCase());
            setAddSuccess(true);
        } catch {
            setAddSuccess(false);
        }
    };

    const handleConfirmRemove = async () => {
        if (!pendingRemove) return;
        try {
            await removeItem.mutateAsync(pendingRemove.ticker);
        } finally {
            setPendingRemove(null);
        }
    };

    const handleToggleCompare = (ticker: string) => {
        setCompareSelected((prev) =>
            prev.includes(ticker)
                ? prev.filter((t) => t !== ticker)
                : prev.length < 5 ? [...prev, ticker] : prev,
        );
    };

    const handleCompare = () => {
        if (compareSelected.length < 2) return;
        compareMetrics.reset();
        compareMetrics.mutate(compareSelected);
    };

    return (
        <div
            data-cy="watchlist-page"
            className="relative min-h-screen p-6 md:p-8 lg:p-12 text-[var(--text)] font-sans"
        >
            <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/8 blur-[120px]" />

            <WatchlistHeader count={items.length} />

            <WatchlistAddForm
                prices={pricesQuery.data ?? []}
                isPending={addItem.isPending}
                error={addWatchlistErrorLabel(addItem.error)}
                success={addSuccess}
                onAdd={(ticker) => void handleAdd(ticker)}
                onReset={() => { setAddSuccess(false); addItem.reset(); }}
            />

            <TabGroup tabs={TABS} active={tab} onChange={setTab} variant="pill" data-testid="watchlist-tabs" />

            <div className="mt-6 relative z-10">
                {watchlist.isLoading && (
                    <div data-cy="watchlist-loading" className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--text-muted)]">
                        <LoaderCircle size={17} className="animate-spin" />
                        Cargando watchlist…
                    </div>
                )}

                {watchlist.isError && (
                    <div data-cy="watchlist-error" className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-5 py-4 text-sm text-rose-300">
                        <AlertCircle size={16} />
                        No pudimos cargar tu watchlist. Intentá de nuevo.
                    </div>
                )}

                {!watchlist.isLoading && !watchlist.isError && (
                    <>
                        {tab === "ver" && (
                            <WatchlistTable items={items} onRemove={setPendingRemove} />
                        )}
                        {tab === "comparar" && (
                            <WatchlistCompare
                                items={items}
                                selected={compareSelected}
                                isPending={compareMetrics.isPending}
                                isError={compareMetrics.isError}
                                results={compareMetrics.data ?? []}
                                onToggle={handleToggleCompare}
                                onCompare={handleCompare}
                            />
                        )}
                    </>
                )}
            </div>

            {pendingRemove && (
                <WatchlistRemoveDialog
                    item={pendingRemove}
                    isPending={removeItem.isPending}
                    onConfirm={() => void handleConfirmRemove()}
                    onCancel={() => setPendingRemove(null)}
                />
            )}
        </div>
    );
}