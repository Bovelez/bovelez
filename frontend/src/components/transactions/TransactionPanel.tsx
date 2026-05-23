import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Hash,
  LoaderCircle,
} from "lucide-react";
import type { StockPrice } from "../../types/prices.types";
import type { TransactionType } from "../../types/transactions.types";
import { useBuyTransaction } from "../../hooks/transactions/useBuyTransaction";
import { useSellTransaction } from "../../hooks/transactions/useSellTransaction";
import { useTickerTransactions } from "../../hooks/transactions/useTickerTransactions";
import {
  buildTransactionInput,
  canSubmitTransaction,
  todayInputValue,
  transactionErrorLabel,
} from "../../hooks/transactions/transaction.utils";

type TransactionPanelProps = {
  selectedPrice: StockPrice | null;
  lastPriceRunFinishedAt?: string | null;
};

function money(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-[17px] text-[var(--text)]">Acción lista</h2>
        <p className="text-[12px] text-[var(--text-muted)]">
          Registrá compras o ventas con el último precio cargado.
        </p>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] p-4">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            Ticker
          </p>
          <p className="mt-1 font-mono text-[24px] font-bold text-[var(--text)]">
            {selectedPrice?.ticker ?? "—"}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            {selectedPrice
              ? `Actualizado ${new Date(selectedPrice.updatedAt).toLocaleString()}`
              : "Sin selección"}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            Precio actual
          </p>
          <p className="mt-1 font-mono text-[18px] font-bold text-[var(--text)]">
            {selectedPrice ? money(selectedPrice.price) : "Sin precio"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Batch: {lastPriceRunFinishedAt ?? "sin actualizar"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
              <Hash size={12} />
              Cantidad
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 font-mono text-[13px] text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
              <CalendarDays size={12} />
              Fecha
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 font-mono text-[13px] text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submitTransaction("BUY")}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buyTransaction.isPending ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <ArrowDownLeft size={15} />
            )}
            Comprar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submitTransaction("SELL")}
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sellTransaction.isPending ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <ArrowUpRight size={15} />
            )}
            Vender
          </button>
        </div>

        {actionError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
            {actionError}
          </div>
        )}

        {lastAction && !actionError && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
            {lastAction === "BUY" ? "Compra" : "Venta"} registrada.
          </div>
        )}

        {selectedPrice && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-deep)]">
            <div className="border-b border-[var(--border)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
                Historial {selectedPrice.ticker}
              </p>
            </div>
            <div className="max-h-[150px] overflow-auto">
              {tickerTransactions.isLoading && (
                <p className="px-3 py-3 text-[12px] text-[var(--text-muted)]">
                  Cargando operaciones...
                </p>
              )}
              {!tickerTransactions.isLoading &&
                (tickerTransactions.data?.length ?? 0) === 0 && (
                  <p className="px-3 py-3 text-[12px] text-[var(--text-muted)]">
                    Sin operaciones para este ticker.
                  </p>
                )}
              {!tickerTransactions.isLoading &&
                tickerTransactions.data?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-3 py-2 first:border-t-0"
                  >
                    <span className="text-[12px] text-[var(--text-muted)]">
                      {transaction.type === "BUY" ? "Compra" : "Venta"} ·{" "}
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-[12px] text-[var(--text)]">
                      {transaction.quantity} @ {money(transaction.price)}
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
