import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Filter,
  LoaderCircle,
  ReceiptText,
  X,
} from "lucide-react";
import { useAllTransactions } from "../../hooks/transactions/useAllTransactions";
import type { Transaction } from "../../types/transactions.types";

type TypeFilter = "all" | "BUY" | "SELL";

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function byDateDesc(a: Transaction, b: Transaction): number {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function Transactions() {
  const transactionsQuery = useAllTransactions();
  const transactions = transactionsQuery.data ?? [];

  const [tickerFilter, setTickerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters =
    tickerFilter !== "" || typeFilter !== "all" || dateFrom !== "" || dateTo !== "";

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (tickerFilter && !t.ticker.includes(tickerFilter.toUpperCase())) return false;
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(t.date) > new Date(dateTo + "T23:59:59")) return false;
        return true;
      })
      .sort(byDateDesc);
  }, [transactions, tickerFilter, typeFilter, dateFrom, dateTo]);

  const buyCount = transactions.filter((t) => t.type === "BUY").length;
  const sellCount = transactions.filter((t) => t.type === "SELL").length;

  const clearFilters = () => {
    setTickerFilter("");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div
      data-testid="transactions-page"
      className="relative min-h-screen p-6 md:p-8 lg:p-12 text-[var(--text)] font-sans selection:bg-[var(--primary)]/30"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 mb-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)]/50 bg-[var(--surface-2)]/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
          <ReceiptText size={12} className="text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Historial Auditado
          </span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)] drop-shadow-sm md:text-5xl lg:text-6xl">
          Operaciones
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
          Registro completo e inmutable de todas tus compras y ventas. Filtrá por
          ticker, tipo de operación o rango de fechas para auditar tus decisiones
          de inversión.
        </p>
      </header>

      {/* Stats */}
      <div className="relative z-10 mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/60 px-5 py-4 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
            Total
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--text)]">
            {transactionsQuery.isLoading ? "…" : transactions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Compras
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-500">
            {transactionsQuery.isLoading ? "…" : buyCount}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
            Ventas
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-rose-500">
            {transactionsQuery.isLoading ? "…" : sellCount}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative z-10 mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 self-end pb-2 text-[var(--text-muted)]">
          <Filter size={15} />
          <span className="text-[12px] font-bold uppercase tracking-widest">
            Filtros
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
            Ticker
          </label>
          <input
            type="text"
            placeholder="AAPL…"
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value.toUpperCase())}
            className="w-28 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
            Tipo
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
          >
            <option value="all">Todas</option>
            <option value="BUY">Compras</option>
            <option value="SELL">Ventas</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 self-end rounded-lg border border-[var(--border)] px-3 py-2 text-[12px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X size={13} />
            Limpiar
          </button>
        )}

        <div className="ml-auto self-end pb-2 text-[12px] text-[var(--text-muted)]">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Transaction list */}
      <div className="relative z-10">
        {transactionsQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-[var(--text-muted)]">
            <LoaderCircle size={18} className="animate-spin" />
            Cargando operaciones...
          </div>
        )}

        {!transactionsQuery.isLoading && transactionsQuery.isError && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
            No pudimos cargar el historial de operaciones. Intentá recargar la
            página.
          </div>
        )}

        {!transactionsQuery.isLoading &&
          !transactionsQuery.isError &&
          filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                <ReceiptText size={24} />
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)]">
                {hasActiveFilters
                  ? "Sin resultados para los filtros aplicados."
                  : "Todavía no registraste ninguna operación."}
              </p>
            </div>
          )}

        {!transactionsQuery.isLoading &&
          !transactionsQuery.isError &&
          filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((t) => {
                const isBuy = t.type === "BUY";
                return (
                  <div
                    key={t.id}
                    className="grid gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)]/40 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]/50 sm:grid-cols-[auto_1fr_auto]"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                        isBuy
                          ? "bg-emerald-500/85 shadow-emerald-500/20"
                          : "bg-rose-500/85 shadow-rose-500/20"
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
                        <span className="font-mono text-base font-extrabold text-[var(--text)]">
                          {t.ticker}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            isBuy
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {isBuy ? "Compra" : "Venta"}
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
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                          Precio unit.
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[var(--text)]">
                          {formatMoney(t.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                          Total
                        </p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-[var(--text)]">
                          {formatMoney(t.quantity * t.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}