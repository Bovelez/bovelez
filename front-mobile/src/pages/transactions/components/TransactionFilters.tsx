import { Filter, X } from 'lucide-react';
import type { TypeFilter } from '../transactions.utils';

type Props = {
  tickerFilter: string;
  typeFilter: TypeFilter;
  dateFrom: string;
  dateTo: string;
  resultCount: number;
  hasActiveFilters: boolean;
  onTickerChange: (value: string) => void;
  onTypeChange: (value: TypeFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear: () => void;
};

const inputClass =
  'rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]';

type FilterFieldProps = {
  label: string;
  children: React.ReactNode;
};

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function TransactionFilters({
  tickerFilter,
  typeFilter,
  dateFrom,
  dateTo,
  resultCount,
  hasActiveFilters,
  onTickerChange,
  onTypeChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: Props) {
  return (
    <div className="relative z-10 mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/60 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 self-end pb-2 text-[var(--text-muted)]">
        <Filter size={15} />
        <span className="text-[12px] font-bold uppercase tracking-widest">
          Filtros
        </span>
      </div>

      <FilterField label="Ticker">
        <input
          data-testid="filter-ticker"
          type="text"
          placeholder="AAPL…"
          value={tickerFilter}
          onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
          className={`w-28 ${inputClass}`}
        />
      </FilterField>

      <FilterField label="Tipo">
        <select
          data-testid="filter-type"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as TypeFilter)}
          className={inputClass}
        >
          <option value="all">Todas</option>
          <option value="BUY">Compras</option>
          <option value="SELL">Ventas</option>
        </select>
      </FilterField>

      <FilterField label="Desde">
        <input
          data-testid="filter-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={inputClass}
        />
      </FilterField>

      <FilterField label="Hasta">
        <input
          data-testid="filter-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className={inputClass}
        />
      </FilterField>

      {hasActiveFilters && (
        <button
          data-testid="filter-clear"
          onClick={onClear}
          className="flex items-center gap-1.5 self-end rounded-lg border border-[var(--border)] px-3 py-2 text-[12px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <X size={13} />
          Limpiar
        </button>
      )}

      <p
        data-testid="filter-result-count"
        className="ml-auto self-end pb-2 text-[12px] text-[var(--text-muted)]"
      >
        {resultCount} resultado{resultCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
