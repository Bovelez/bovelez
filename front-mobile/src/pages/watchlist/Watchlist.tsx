import { useState } from 'react';
import { Trash2, AlertCircle, LoaderCircle, Star } from 'lucide-react';
import { useWatchlist } from '../../hooks/watchlist/useWatchlist';
import { useRemoveWatchlistItem } from '../../hooks/watchlist/useRemoveWatchlistItem';
import { useAddWatchlistItem } from '../../hooks/watchlist/useAddWatchlist';
import { useCompareMetrics } from '../../hooks/watchlist/useCompareMetrics';
import { useStockPrices } from '../../hooks/prices/useStockPrices';
import { addWatchlistErrorLabel, type WatchlistTab } from './watchlist.utils';
import { TabGroup } from '../../components/ui/TabGroup';
import { WatchlistAddForm } from '../../components/watchlist/WatchListAddForm';
import { WatchlistCompare } from '../../components/watchlist/WatchlistCompare';
import { WatchlistRemoveDialog } from '../../components/watchlist/WatchlistRemoveDialog';
import type { WatchlistItem } from '../../types/watchlist.types';

const TABS: { key: WatchlistTab; label: string }[] = [
  { key: 'ver', label: 'Lista' },
  { key: 'comparar', label: 'Comparar' },
];

export default function Watchlist() {
  const [tab, setTab] = useState<WatchlistTab>('ver');
  const [addSuccess, setAddSuccess] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<WatchlistItem | null>(
    null,
  );
  const [compareSelected, setCompareSelected] = useState<string[]>([]);

  const watchlist = useWatchlist();
  const addItem = useAddWatchlistItem();
  const removeItem = useRemoveWatchlistItem();
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
        : prev.length < 5
          ? [...prev, ticker]
          : prev,
    );
  };

  const handleCompare = () => {
    if (compareSelected.length < 2) return;
    compareMetrics.reset();
    compareMetrics.mutate(compareSelected);
  };

  return (
    <div
      data-testid="watchlist-page"
      className="px-4 py-5 text-[var(--text)]"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--surface)] border border-[var(--border)]">
          <Star size={16} className="text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[var(--text)]">Watchlist</h1>
          <p className="text-xs text-[var(--text-muted)]">
            {items.length} empresa{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Add form con sugerencias */}
      <WatchlistAddForm
        prices={pricesQuery.data ?? []}
        isPending={addItem.isPending}
        error={addWatchlistErrorLabel(addItem.error)}
        success={addSuccess}
        onAdd={(ticker) => void handleAdd(ticker)}
        onReset={() => {
          setAddSuccess(false);
          addItem.reset();
        }}
      />

      {/* Tabs */}
      <div className="mb-4">
        <TabGroup
          tabs={TABS}
          active={tab}
          onChange={setTab}
          variant="pill"
          data-testid="watchlist-tabs"
        />
      </div>

      {watchlist.isLoading && (
        <div
          data-testid="watchlist-loading"
          className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-muted)]"
        >
          <LoaderCircle size={17} className="animate-spin" />
          Cargando watchlist…
        </div>
      )}
      {watchlist.isError && (
        <div
          data-testid="watchlist-error"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-4 py-4 text-sm text-rose-300"
        >
          <AlertCircle size={16} />
          No pudimos cargar tu watchlist.
        </div>
      )}

      {!watchlist.isLoading && !watchlist.isError && (
        <>
          {tab === 'ver' && (
            <div data-testid="watchlist-list">
              {items.length === 0 && (
                <p className="text-center py-12 text-sm text-[var(--text-muted)]">
                  Tu watchlist está vacía.
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item.ticker}
                  data-testid={`watchlist-item-${item.ticker}`}
                  className="flex items-center justify-between px-4 py-4 mb-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-2)] font-mono text-xs font-black text-[var(--primary)]">
                      {item.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-mono font-black text-sm text-[var(--text)]">
                        {item.ticker}
                      </p>
                      {item.companyName && (
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">
                          {item.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    data-testid={`watchlist-remove-${item.ticker}`}
                    onClick={() => setPendingRemove(item)}
                    disabled={removeItem.isPending}
                    className="p-2.5 rounded-xl text-rose-400 bg-rose-500/10 border border-rose-500/20 disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'comparar' && (
            <div data-testid="watchlist-compare" className="overflow-x-auto">
              <WatchlistCompare
                items={items}
                selected={compareSelected}
                isPending={compareMetrics.isPending}
                isError={compareMetrics.isError}
                results={compareMetrics.data ?? []}
                onToggle={handleToggleCompare}
                onCompare={handleCompare}
              />
            </div>
          )}
        </>
      )}

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
