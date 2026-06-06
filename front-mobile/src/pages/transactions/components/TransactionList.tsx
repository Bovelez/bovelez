import { LoaderCircle, ReceiptText } from 'lucide-react';
import type { Transaction } from '../../../types/transactions.types';
import { TransactionRow } from './TransactionRow';

type Props = {
  transactions: Transaction[];
  isLoading: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
};

export function TransactionList({
  transactions,
  isLoading,
  isError,
  hasActiveFilters,
}: Props) {
  if (isLoading) {
    return (
      <div
        data-testid="transactions-list-loading"
        className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-[var(--text-muted)]"
      >
        <LoaderCircle size={18} className="animate-spin" />
        Cargando operaciones...
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="transactions-list-error"
        className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-300"
      >
        No pudimos cargar el historial de operaciones. Intentá recargar la
        página.
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        data-testid="transactions-list-empty"
        className="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)]">
          <ReceiptText size={24} />
        </div>
        <p className="text-sm font-medium text-[var(--text-muted)]">
          {hasActiveFilters
            ? 'Sin resultados para los filtros aplicados.'
            : 'Todavía no registraste ninguna operación.'}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="transactions-list" className="space-y-2">
      {transactions.map((t) => (
        <TransactionRow key={t.id} transaction={t} />
      ))}
    </div>
  );
}
