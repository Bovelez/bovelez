import { LoaderCircle } from 'lucide-react';
import type { WatchlistItem } from '../../types/watchlist.types.ts';

interface WatchlistRemoveDialogProps {
  item: WatchlistItem;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WatchlistRemoveDialog({
  item,
  isPending,
  onConfirm,
  onCancel,
}: WatchlistRemoveDialogProps) {
  return (
    <div
      data-testid="remove-confirm-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <p className="text-base font-bold text-[var(--text)] mb-2">
          ¿Eliminar {item.name ?? item.ticker}?
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Se quitará{' '}
          <span className="font-mono font-bold text-[var(--primary)]">
            {item.ticker}
          </span>{' '}
          de tu watchlist. Tus posiciones existentes no se verán afectadas.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            data-testid="remove-cancel-btn"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--border)] text-[var(--text-muted)]"
          >
            Cancelar
          </button>
          <button
            data-testid="remove-confirm-btn"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <LoaderCircle size={13} className="animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
