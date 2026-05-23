import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Hash,
  LoaderCircle,
} from "lucide-react";
import type {TransactionPanelProps, TransactionType} from "../../types/transactions.types";
import { useBuyTransaction } from "../../hooks/transactions/useBuyTransaction";
import { useSellTransaction } from "../../hooks/transactions/useSellTransaction";
import { useTickerTransactions } from "../../hooks/transactions/useTickerTransactions";
import {
  buildTransactionInput,
  canSubmitTransaction,
  todayInputValue,
  transactionErrorLabel,
} from "../../hooks/transactions/transaction.utils";
import {useMoney} from "../../hooks/portfolio/utils/useMoney.ts";

export function TransactionPanel({
  selectedPrice,
  lastPriceRunFinishedAt,
}: TransactionPanelProps) {
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(todayInputValue());
  const [lastAction, setLastAction] = useState<TransactionType | null>(null);
  const buyTransaction = useBuyTransaction();
  const sellTransaction = useSellTransaction();
  const tickerTransactions = useTickerTransactions(selectedPrice?.ticker ?? null);
  const actionError = transactionErrorLabel(
    buyTransaction.error ?? sellTransaction.error,
  );
  const isSubmitting = buyTransaction.isPending || sellTransaction.isPending;
  const canSubmit = canSubmitTransaction({
    date,
    isSubmitting,
    quantity,
    selectedPrice,
  });

  const submitTransaction = async (type: TransactionType) => {
    const input = buildTransactionInput({ date, quantity, selectedPrice });
    if (!input) return;

    setLastAction(null);
    buyTransaction.reset();
    sellTransaction.reset();

    try {
      if (type === "BUY") {
        await buyTransaction.mutateAsync(input);
      } else {
        await sellTransaction.mutateAsync(input);
      }
      setLastAction(type);
      setQuantity("1");
    } catch {
      setLastAction(null);
    }
  };

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)]/60 bg-[var(--surface)]/80 shadow-2xl backdrop-blur-2xl transition-all duration-500">
      <div className="pointer-events-none absolute right-0 top-0 rounded-full bg-[var(--primary)]/5 p-32 blur-[80px]" />

      <div className="relative z-10 flex items-center gap-3 border-b border-[var(--border)]/40 bg-[var(--surface-2)]/20 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
          <ArrowDownLeft size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--text)]">Terminal</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Ejecución de órdenes
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-5 overflow-y-auto p-6">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-deep)] to-[var(--surface)] p-5 shadow-inner">
          <div className="absolute -right-4 -top-4 text-[var(--surface-2)] opacity-50">
            <Hash size={100} strokeWidth={1} />
          </div>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
              Activo Seleccionado
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold text-[var(--text)] text-shadow-sm">
              {selectedPrice?.ticker ?? "—"}
            </p>

            <div className="mt-4 flex items-end justify-between border-t border-[var(--border)]/50 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                  Cotización Actual
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                  {selectedPrice ? useMoney(selectedPrice.price) : "—"}
                </p>
              </div>
              <p className="text-right text-[10px] text-[var(--text-muted)]">
                {selectedPrice
                  ? `Ref: ${new Date(selectedPrice.updatedAt).toLocaleTimeString()}`
                  : "Esperando selección"}
                <br />
                Batch: {lastPriceRunFinishedAt ?? "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="group flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)] transition-colors group-focus-within:text-[var(--primary)]">
              <Hash size={14} />
              Cantidad
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)]/80 bg-[var(--bg-deep)]/80 px-4 py-3 font-mono text-base font-medium text-[var(--text)] shadow-inner outline-none transition-all focus:border-[var(--primary)]/60 focus:bg-[var(--bg-deep)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </label>

          <label className="group flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--text-faint)] transition-colors group-focus-within:text-blue-400">
              <CalendarDays size={14} />
              Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)]/80 bg-[var(--bg-deep)]/80 px-4 py-3 font-mono text-[14px] font-medium text-[var(--text)] shadow-inner outline-none transition-all focus:border-blue-400/60 focus:bg-[var(--bg-deep)] focus:ring-2 focus:ring-blue-400/20"
            />
          </label>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submitTransaction("BUY")}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
            {buyTransaction.isPending ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ArrowDownLeft size={18} strokeWidth={2.5} />
            )}
            COMPRAR
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submitTransaction("SELL")}
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 px-4 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] hover:shadow-rose-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
            {sellTransaction.isPending ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ArrowUpRight size={18} strokeWidth={2.5} />
            )}
            VENDER
          </button>
        </div>

        {actionError && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-2 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300 shadow-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 font-bold text-rose-400">
              !
            </span>
            <p className="mt-0.5">{actionError}</p>
          </div>
        )}

        {lastAction && !actionError && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-2 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] font-medium text-emerald-300 shadow-sm">
            <CheckCircle2 size={16} />
            {lastAction === "BUY" ? "Compra" : "Venta"} ejecutada correctamente.
          </div>
        )}

        {selectedPrice && (
          <div className="mt-4 rounded-xl border border-[var(--border)]/50 bg-[var(--bg-deep)]/40 shadow-inner">
            <div className="border-b border-[var(--border)]/30 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                Registro de Órdenes ({selectedPrice.ticker})
              </p>
            </div>
            <div className="max-h-[160px] overflow-auto p-1">
              {tickerTransactions.isLoading && (
                <p className="flex justify-center px-4 py-4 text-center text-[12px] text-[var(--text-muted)]">
                  <LoaderCircle size={16} className="animate-spin" />
                </p>
              )}
              {!tickerTransactions.isLoading &&
                (tickerTransactions.data?.length ?? 0) === 0 && (
                  <p className="px-4 py-4 text-center text-[12px] text-[var(--text-muted)]">
                    No hay historial de operaciones.
                  </p>
                )}
              {!tickerTransactions.isLoading &&
                tickerTransactions.data?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]/50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm ${
                          transaction.type === "BUY"
                            ? "bg-emerald-500/80 shadow-emerald-500/20"
                            : "bg-rose-500/80 shadow-rose-500/20"
                        }`}
                      >
                        {transaction.type === "BUY" ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {new Date(transaction.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="font-mono text-[13px] font-semibold text-[var(--text)]">
                      {transaction.quantity}{" "}
                      <span className="text-[var(--text-faint)]">@</span>{" "}
                      {useMoney(transaction.price)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
