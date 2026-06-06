import { ArrowDownLeft, ArrowUpRight, CalendarDays } from 'lucide-react';
import type { Transaction } from '../../../types/transactions.types';
import { formatDate, formatMoney, formatNumber } from '../transactions.utils';

type Props = {
  transaction: Transaction;
};

type PriceStatProps = {
  label: string;
  value: string;
};

function PriceStat({ label, value }: PriceStatProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-bold text-[var(--text)]">
        {value}
      </p>
    </div>
  );
}

export function TransactionRow({ transaction: t }: Props) {
  const isBuy = t.type === 'BUY';

  return (
    <div
      data-testid="transaction-row"
      className="grid gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/40 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]/50 sm:grid-cols-[auto_1fr_auto]"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
          isBuy
            ? 'bg-emerald-500/85 shadow-emerald-500/20'
            : 'bg-rose-500/85 shadow-rose-500/20'
        }`}
      >
        {isBuy ? (
          <ArrowDownLeft size={18} strokeWidth={2.4} />
        ) : (
          <ArrowUpRight size={18} strokeWidth={2.4} />
        )}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="transaction-row-ticker"
            className="font-mono text-base font-extrabold text-[var(--text)]"
          >
            {t.ticker}
          </span>
          <span
            data-testid="transaction-row-type"
            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              isBuy
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {isBuy ? 'Compra' : 'Venta'}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            {formatDate(t.date)}
          </span>
          <span>{formatNumber(t.quantity)} acciones</span>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:text-right">
        <PriceStat label="Precio unit." value={formatMoney(t.price)} />
        <PriceStat label="Total" value={formatMoney(t.quantity * t.price)} />
      </div>
    </div>
  );
}
