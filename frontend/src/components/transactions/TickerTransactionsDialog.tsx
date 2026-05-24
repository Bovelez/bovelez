import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  History,
  LoaderCircle,
  ReceiptText,
  X,
} from "lucide-react";
import { useTickerTransactions } from "../../hooks/transactions/useTickerTransactions";
import { useSellTransaction } from "../../hooks/transactions/useSellTransaction";
import type { TickerTransactionsDialogProps } from "../../types/transactions.types";
import { useMoney } from "../../hooks/transactions/utils/useMoney.ts";
import { useFormatNumber } from "../../hooks/transactions/utils/useFormatNumber.ts";
import {
  byLatestTransaction,
  formatDate,
  todayInputValue,
  transactionErrorLabel,
} from "../../hooks/transactions/utils/transaction.utils.ts";

export function TickerTransactionsDialog({ open, position, onOpenChange }: TickerTransactionsDialogProps) {
  const [sellQuantity, setSellQuantity] = useState("1");
  const [sellDate, setSellDate] = useState(todayInputValue());
  const [sellSucceeded, setSellSucceeded] = useState(false);
  const tickerTransactions = useTickerTransactions(position?.ticker ?? null);
  const sellTransaction = useSellTransaction();
  const recentTransactions = [...(tickerTransactions.data ?? [])].sort(byLatestTransaction).slice(0, 8);
  const ticker = position?.ticker ?? "";
  const totalTraded = recentTransactions.reduce((s, t) => s + t.quantity * t.price, 0);
  const parsedSellQuantity = Number(sellQuantity);
  const availableQuantity = position?.quantity ?? 0;
  const estimatedProceeds =
      position?.currentPrice && Number.isFinite(parsedSellQuantity) && parsedSellQuantity > 0
          ? position.currentPrice * parsedSellQuantity
          : null;
  const sellError = transactionErrorLabel(sellTransaction.error);
  const canSell =
      Boolean(position?.hasPrice) &&
      Boolean(ticker) &&
      Number.isFinite(parsedSellQuantity) &&
      parsedSellQuantity > 0 &&
      parsedSellQuantity <= availableQuantity &&
      sellDate === todayInputValue() &&
      !sellTransaction.isPending;

  const submitSell = async () => {
    if (!position || !canSell) return;
    setSellSucceeded(false);
    sellTransaction.reset();
    try {
      await sellTransaction.mutateAsync({
        ticker: position.ticker,
        quantity: parsedSellQuantity,
        date: sellDate,
      });
      setSellQuantity("1");
      setSellSucceeded(true);
    } catch {
      setSellSucceeded(false);
    }
  };

  return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[var(--surface)] shadow-2xl shadow-black/70 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">

            {/* Header */}
            <div className="relative overflow-hidden border-b border-white/[0.06] bg-[var(--surface-2)]/40 px-6 py-6">
              <div className="pointer-events-none absolute right-4 top-0 text-orange-500/[0.05]">
                <ReceiptText size={140} strokeWidth={1} />
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-500/20">
                    <History size={24} strokeWidth={2} className="text-white" />
                  </div>
                  <div>
                    <Dialog.Title className="font-mono text-[26px] font-black not-italic text-[var(--text)]">
                      {ticker || "Ticker"}
                    </Dialog.Title>
                    <Dialog.Description className="mt-0.5 text-sm text-[var(--text-muted)]">
                      Últimas operaciones registradas para esta posición.
                    </Dialog.Description>
                  </div>
                </div>

                <Dialog.Close asChild>
                  <button
                      type="button"
                      aria-label="Cerrar historial"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 text-[var(--text-muted)] transition-colors hover:border-white/20 hover:text-[var(--text)]"
                  >
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>

              {/* Stats row */}
              {position && (
                  <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Cantidad", value: useFormatNumber(position.quantity), color: "text-[var(--text)]" },
                      { label: "Costo Prom.", value: useMoney(position.avgCost), color: "text-[var(--text)]" },
                      { label: "Total Operado", value: useMoney(totalTraded), color: "text-orange-400" },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-white/[0.05] bg-[var(--bg-deep)]/60 px-4 py-3"
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">{label}</p>
                          <p className={`mt-1.5 font-mono text-[18px] font-black ${color}`}>{value}</p>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-4">
              {position && (
                  <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-100/85">
                          Venta rápida
                        </p>
                        <p className="mt-1 text-xs font-semibold text-white/80">
                          Vendé {ticker} sin volver al terminal.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(96px,0.8fr)_minmax(136px,1fr)_minmax(124px,0.9fr)]">
                      <label className="min-w-0 flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                          Cantidad
                        </span>
                        <input
                            type="number"
                            min="1"
                            max={availableQuantity}
                            step="1"
                            value={sellQuantity}
                            onChange={(e) => {
                              setSellSucceeded(false);
                              setSellQuantity(e.target.value);
                            }}
                            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 px-3 font-mono text-sm font-bold text-[var(--text)] outline-none transition-all focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/15"
                        />
                      </label>

                      <label className="min-w-0 flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                          Fecha
                        </span>
                        <input
                            type="date"
                            min={todayInputValue()}
                            max={todayInputValue()}
                            value={sellDate}
                            onChange={(e) => {
                              setSellSucceeded(false);
                              setSellDate(e.target.value);
                            }}
                            className="h-11 w-full rounded-xl border border-white/[0.08] bg-[var(--bg-deep)]/80 px-3 font-mono text-xs font-bold text-[var(--text)] outline-none transition-all focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/15"
                        />
                      </label>

                      <div className="min-w-0 rounded-xl border border-white/[0.06] bg-[var(--bg-deep)]/60 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                          Estimado
                        </p>
                        <p className="mt-1 truncate font-mono text-sm font-black text-rose-200">
                          {useMoney(estimatedProceeds)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                          type="button"
                          onClick={() => {
                            setSellSucceeded(false);
                            setSellQuantity(String(availableQuantity));
                          }}
                          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-black text-white/85 transition-colors hover:border-rose-400/35 hover:bg-white/[0.07] hover:text-white"
                      >
                        <span className="truncate">Vender todo</span>
                      </button>

                      <button
                          type="button"
                          disabled={!canSell}
                          onClick={() => void submitSell()}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 px-4 text-xs font-black text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-40 disabled:grayscale"
                      >
                        {sellTransaction.isPending
                            ? <LoaderCircle size={15} className="animate-spin" />
                            : <ArrowUpRight size={15} strokeWidth={2.5} />}
                        <span className="truncate">Vender</span>
                      </button>
                    </div>

                    {parsedSellQuantity > availableQuantity && (
                        <p className="mt-3 text-xs font-semibold text-rose-200">
                          Solo tenés {useFormatNumber(availableQuantity)} acciones disponibles.
                        </p>
                    )}

                    {!position.hasPrice && (
                        <p className="mt-3 text-xs font-semibold text-rose-200">
                          No hay precio actual para vender {ticker}.
                        </p>
                    )}

                    {sellError && (
                        <p className="mt-3 text-xs font-semibold text-rose-200">
                          {sellError}
                        </p>
                    )}

                    {sellSucceeded && !sellError && (
                        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 size={14} />
                          Venta ejecutada correctamente.
                        </p>
                    )}
                  </div>
              )}

              {tickerTransactions.isLoading && (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-[var(--text-muted)]">
                    <LoaderCircle size={17} className="animate-spin" />
                    Cargando operaciones…
                  </div>
              )}

              {!tickerTransactions.isLoading && tickerTransactions.isError && (
                  <div className="m-2 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-5 py-4 text-sm text-rose-300">
                    No pudimos cargar el historial de {ticker}.
                  </div>
              )}

              {!tickerTransactions.isLoading && !tickerTransactions.isError && recentTransactions.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-muted)]">
                      <ReceiptText size={24} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-muted)]">
                      No hay operaciones para {ticker}.
                    </p>
                  </div>
              )}

              {!tickerTransactions.isLoading && !tickerTransactions.isError && recentTransactions.length > 0 && (
                  <div className="space-y-2">
                    {recentTransactions.map((transaction) => {
                      const isBuy = transaction.type === "BUY";
                      const total = transaction.quantity * transaction.price;
                      return (
                          <div
                              key={transaction.id}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-[var(--bg-deep)]/40 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                          >
                            <div className="flex items-center gap-3">
                        <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                                isBuy
                                    ? "bg-emerald-500/80 shadow-emerald-500/15"
                                    : "bg-rose-500/80 shadow-rose-500/15"
                            }`}
                        >
                          {isBuy
                              ? <ArrowDownLeft size={17} strokeWidth={2.5} />
                              : <ArrowUpRight size={17} strokeWidth={2.5} />}
                        </span>
                              <div>
                                <p className="text-[14px] font-black text-[var(--text)]">
                                  {isBuy ? "Compra" : "Venta"} · {useFormatNumber(transaction.quantity)} acc.
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                  <CalendarDays size={11} />
                                  {formatDate(transaction.date)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-right">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">Precio</p>
                                <p className="mt-1 font-mono text-[14px] font-bold text-[var(--text)]">
                                  {useMoney(transaction.price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-faint)]">Total</p>
                                <p className="mt-1 font-mono text-[14px] font-black text-orange-400">
                                  {useMoney(total)}
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
