import { useState } from "react";
import { Database, ShieldCheck } from "lucide-react";
import { PriceTickerSelect } from "../../components/prices/PriceTickerSelect";
import { TransactionPanel } from "../../components/transactions/TransactionPanel";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import type { StockPrice } from "../../types/prices.types";

function errorLabel(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  return "No pudimos cargar los precios.";
}

export default function Portfolio() {
  const pricesQuery = useStockPrices();
  const lastPriceRunQuery = useLastPriceRun();
  const prices = pricesQuery.data ?? [];
  const [selectedPrice, setSelectedPrice] = useState<StockPrice | null>(null);
  const marketError = errorLabel(pricesQuery.error);

  return (
    <div
      data-testid="portfolio-page"
      className="relative p-8 text-[var(--text)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full opacity-50"
        style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
      />

      <div className="relative mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Portfolio
          </p>
          <h1 className="font-mono text-[38px] font-bold leading-none">
            Operar acciones
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-[var(--text-muted)]">
            Primer paso: seleccionar un ticker S&amp;P con precio cargado para
            usarlo luego en compra o venta.
          </p>
        </div>
      </div>

      <div className="relative mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--primary)]">
            <Database size={17} />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            Universo
          </p>
          <p className="mt-1 font-mono text-[18px] font-bold text-[var(--text)]">
            {pricesQuery.isLoading ? "..." : prices.length.toString()}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            tickers con precio cargado
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 md:col-span-2">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-emerald-400">
            <ShieldCheck size={17} />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
            Selección actual
          </p>
          <p className="mt-1 font-mono text-[18px] font-bold text-[var(--text)]">
            {selectedPrice?.ticker ?? "—"}
          </p>
          <p className="mt-1 truncate text-[12px] text-[var(--text-muted)]">
            {selectedPrice
              ? `$${selectedPrice.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} · actualizado ${new Date(
                  selectedPrice.updatedAt,
                ).toLocaleDateString()}`
              : "Elegí una empresa para operar"}
          </p>
        </div>
      </div>

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PriceTickerSelect
          prices={prices}
          selectedPrice={selectedPrice}
          isLoading={pricesQuery.isLoading}
          errorMessage={marketError}
          onSelectPrice={setSelectedPrice}
          onClearSelection={() => setSelectedPrice(null)}
        />

        <TransactionPanel
          selectedPrice={selectedPrice}
          lastPriceRunFinishedAt={lastPriceRunQuery.data?.finishedAt}
        />
      </div>
    </div>
  );
}
