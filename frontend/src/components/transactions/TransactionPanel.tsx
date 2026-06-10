import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Hash,
  LoaderCircle,
  Zap,
} from "lucide-react";
import type { TransactionPanelProps, TransactionType } from "../../types/transactions.types";
import { useBuyTransaction } from "../../hooks/transactions/useBuyTransaction";
import { useSellTransaction } from "../../hooks/transactions/useSellTransaction";
import { useTickerTransactions } from "../../hooks/transactions/useTickerTransactions";
import {
  buildTransactionInput,
  canSubmitTransaction,
  todayInputValue,
  transactionErrorLabel,
} from "../../hooks/transactions/utils/transaction.utils";
import { formatMoney } from "../../hooks/transactions/utils/formatMoney.ts";

export function TransactionPanel({ selectedPrice, lastPriceRunFinishedAt }: TransactionPanelProps) {
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(todayInputValue());
  const [lastAction, setLastAction] = useState<TransactionType | null>(null);
  const buyTransaction = useBuyTransaction();
  const sellTransaction = useSellTransaction();
  const tickerTransactions = useTickerTransactions(selectedPrice?.ticker ?? null);
  const actionError = transactionErrorLabel(buyTransaction.error ?? sellTransaction.error);
  const isSubmitting = buyTransaction.isPending || sellTransaction.isPending;
  const canSubmit = canSubmitTransaction({ date, isSubmitting, quantity, selectedPrice });

  const submitTransaction = async (type: TransactionType) => {
    const input = buildTransactionInput({ date, quantity, selectedPrice });
    if (!input) return;
    setLastAction(null);
    buyTransaction.reset();
    sellTransaction.reset();
    try {
      if (type === "BUY") await buyTransaction.mutateAsync(input);
      else await sellTransaction.mutateAsync(input);
      setLastAction(type);
      setQuantity("1");
    } catch {
      setLastAction(null);
    }
  };

  const totalCost = selectedPrice
      ? (parseFloat(quantity) || 0) * selectedPrice.price
      : null;

  return (
      <section data-cy="transaction-panel" className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--surface)]/60 shadow-2xl backdrop-blur-xl">
        {/* Glow accent */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-orange-500/[0.04] blur-[80px]" />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.05] bg-[var(--surface-2)]/30 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
            <Zap size={20} strokeWidth={2.2} className="text-white" />
          </div>
          <div>
            <h2 className="text-[17px] font-black tracking-tight text-[var(--text)]">Terminal</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Ejecución de órdenes</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-5 overflow-y-auto p-6">

          {/* Selected asset display */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--bg-deep)]/70 p-5">
            <div className="absolute -right-3 -top-3 text-white/[0.03]">
              <Hash size={110} strokeWidth={1} />
            </div>
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">
                Activo Seleccionado
              </p>
              <p data-cy="transaction-selected-ticker" className="mt-1.5 font-mono text-[32px] font-black leading-none text-[var(--text)]">
                {selectedPrice?.ticker ?? "—"}
              </p>

              <div className="mt-4 flex items-end justify-between border-t border-white/[0.05] pt-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Cotización
                  </p>
                  <p className="mt-1 font-mono text-[22px] font-black text-emerald-400">
                    {selectedPrice ? formatMoney(selectedPrice.price) : "—"}
                  </p>
                </div>
                {totalCost !== null && totalCost > 0 && (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        Costo Total
                      </p>
                      <p className="mt-1 font-mono text-base font-black text-orange-400">
                        {formatMoney(totalCost)}
                      </p>
                    </div>
                )}
                {!selectedPrice && (
                    <p className="text-right text-[11px] text-[var(--text-muted)]">
                      Seleccioná un activo
                      <br />
                      en el explorador
                    </p>
                )}
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <label className="group flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)] transition-colors group-focus-within:text-orange-400">
              <Hash size={12} />
              Cantidad
            </span>
              <input
                  data-cy="transaction-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 px-4 py-3 font-mono text-[15px] font-bold text-[var(--text)] shadow-inner outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/15"
              />
            </label>

            <label className="group flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)] transition-colors group-focus-within:text-blue-400">
              <CalendarDays size={12} />
              Fecha
            </span>
              <input
                  data-cy="transaction-date"
                  type="date"
                  min={todayInputValue()}
                  max={todayInputValue()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 px-4 py-3 font-mono text-[13px] font-bold text-[var(--text)] shadow-inner outline-none transition-all focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/15"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
                data-cy="transaction-buy-btn"
                type="button"
                disabled={!canSubmit}
                onClick={() => void submitTransaction("BUY")}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 py-4 text-[13px] font-black tracking-wide text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:grayscale"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              {buyTransaction.isPending
                  ? <LoaderCircle size={17} className="animate-spin" />
                  : <ArrowDownLeft size={17} strokeWidth={2.5} />}
              COMPRAR
            </button>
            <button
                data-cy="transaction-sell-btn"
                type="button"
                disabled={!canSubmit}
                onClick={() => void submitTransaction("SELL")}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 py-4 text-[13px] font-black tracking-wide text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] hover:shadow-rose-500/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:grayscale"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              {sellTransaction.isPending
                  ? <LoaderCircle size={17} className="animate-spin" />
                  : <ArrowUpRight size={17} strokeWidth={2.5} />}
              VENDER
            </button>
          </div>

          {/* Error */}
          {actionError && (
              <div data-cy="transaction-error" className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-[13px] text-rose-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-xs font-black text-rose-400">!</span>
                <p className="mt-0.5">{actionError}</p>
              </div>
          )}

          {/* Success */}
          {lastAction && !actionError && (
              <div data-cy="transaction-success" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-[13px] font-semibold text-emerald-300">
                <CheckCircle2 size={15} />
                {lastAction === "BUY" ? "Compra" : "Venta"} ejecutada correctamente.
              </div>
          )}

          {/* Order history for selected ticker */}
          {selectedPrice && (
              <div className="rounded-2xl border border-white/[0.05] bg-[var(--bg-deep)]/40">
                <div className="border-b border-white/[0.04] px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Historial · {selectedPrice.ticker}
                  </p>
                </div>
                <div className="max-h-[180px] overflow-auto p-1.5">
                  {tickerTransactions.isLoading && (
                      <p className="flex justify-center px-4 py-5 text-[var(--text-muted)]">
                        <LoaderCircle size={15} className="animate-spin" />
                      </p>
                  )}
                  {!tickerTransactions.isLoading && (tickerTransactions.data?.length ?? 0) === 0 && (
                      <p className="px-4 py-5 text-center text-[12px] text-[var(--text-muted)]">
                        Sin operaciones registradas.
                      </p>
                  )}
                  {!tickerTransactions.isLoading &&
                      tickerTransactions.data?.map((tx) => (
                          <div
                              key={tx.id}
                              data-cy="transaction-history-item"
                              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                          >
                            <div className="flex items-center gap-2.5">
                      <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${
                              tx.type === "BUY"
                                  ? "bg-emerald-500/75 shadow-sm shadow-emerald-500/20"
                                  : "bg-rose-500/75 shadow-sm shadow-rose-500/20"
                          }`}
                      >
                        {tx.type === "BUY"
                            ? <ArrowDownLeft size={13} strokeWidth={2.5} />
                            : <ArrowUpRight size={13} strokeWidth={2.5} />}
                      </span>
                              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                        {new Date(tx.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                            </div>
                            <span className="font-mono text-[13px] font-bold text-[var(--text)]">
                      {tx.quantity} <span className="text-[var(--text-faint)]">@</span> {formatMoney(tx.price)}
                    </span>
                          </div>
                      ))}
                </div>
              </div>
          )}

          {/* Batch info */}
          {lastPriceRunFinishedAt && (
              <p className="text-center text-[10px] text-[var(--text-faint)]">
                Último batch: {lastPriceRunFinishedAt}
              </p>
          )}
        </div>
      </section>
  );
}
