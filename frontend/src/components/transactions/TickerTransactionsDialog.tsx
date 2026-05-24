import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  History,
  LoaderCircle,
  ReceiptText,
  X,
} from "lucide-react";
import { useTickerTransactions } from "../../hooks/transactions/useTickerTransactions";
import type {TickerTransactionsDialogProps} from "../../types/transactions.types";
import {useMoney} from "../../hooks/transactions/utils/useMoney.ts";
import {useFormatNumber} from "../../hooks/transactions/utils/useFormatNumber.ts";
import {byLatestTransaction, formatDate} from "../../hooks/transactions/utils/transaction.utils.ts";

export function TickerTransactionsDialog({
  open,
  position,
  onOpenChange,
}: TickerTransactionsDialogProps) {
  const tickerTransactions = useTickerTransactions(position?.ticker ?? null);
  const recentTransactions = [...(tickerTransactions.data ?? [])]
    .sort(byLatestTransaction)
    .slice(0, 8);
  const ticker = position?.ticker ?? "";
  const totalTraded = recentTransactions.reduce(
    (sum, transaction) => sum + transaction.quantity * transaction.price,
    0,
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-[var(--border)]/80 bg-[var(--surface)] shadow-2xl shadow-black/60 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <div className="relative overflow-hidden border-b border-[var(--border)]/50 bg-[var(--surface-2)]/40 px-6 py-5">
            <div className="pointer-events-none absolute right-6 top-2 text-[var(--primary)]/10">
              <ReceiptText size={132} strokeWidth={1.2} />
            </div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-500/25">
                  <History size={24} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <Dialog.Title className="font-mono text-2xl font-extrabold not-italic tracking-normal text-[var(--text)]">
                    {ticker || "Ticker"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[var(--text-muted)]">
                    Últimas operaciones registradas para esta posición.
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar historial"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]/70 bg-[var(--bg-deep)]/80 text-[var(--text-muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--text)]"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            {position && (
              <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--bg-deep)]/50 px-4 py-3 shadow-inner">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                    Tenencia
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-[var(--text)]">
                    {useFormatNumber(position.quantity)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--bg-deep)]/50 px-4 py-3 shadow-inner">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                    Costo Prom.
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-[var(--text)]">
                    {useMoney(position.avgCost)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--bg-deep)]/50 px-4 py-3 shadow-inner">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                    Operado
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-[var(--text)]">
                    {useMoney(totalTraded)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-y-auto p-3 sm:p-4">
            {tickerTransactions.isLoading && (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm font-medium text-[var(--text-muted)]">
                <LoaderCircle size={18} className="animate-spin" />
                Cargando operaciones...
              </div>
            )}

            {!tickerTransactions.isLoading && tickerTransactions.isError && (
              <div className="m-2 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
                No pudimos cargar el historial de {ticker}.
              </div>
            )}

            {!tickerTransactions.isLoading &&
              !tickerTransactions.isError &&
              recentTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                    <ReceiptText size={24} />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    No hay operaciones registradas para {ticker}.
                  </p>
                </div>
              )}

            {!tickerTransactions.isLoading &&
              !tickerTransactions.isError &&
              recentTransactions.length > 0 && (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => {
                    const isBuy = transaction.type === "BUY";
                    return (
                      <div
                        key={transaction.id}
                        className="grid gap-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--bg-deep)]/35 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]/45 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
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
                            <p className="text-sm font-bold text-[var(--text)]">
                              {isBuy ? "Compra" : "Venta"} de {useFormatNumber(transaction.quantity)} acciones
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <CalendarDays size={13} />
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-6 sm:justify-end sm:text-right">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                              Precio
                            </p>
                            <p className="mt-1 font-mono text-sm font-bold text-[var(--text)]">
                              {useMoney(transaction.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                              Total
                            </p>
                            <p className="mt-1 font-mono text-sm font-bold text-[var(--text)]">
                              {useMoney(transaction.quantity * transaction.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
