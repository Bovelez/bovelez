import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Database, ShieldCheck } from "lucide-react";
import { PriceTickerSelect } from "../../components/prices/PriceTickerSelect";
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

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-[17px] text-[var(--text)]">Acción lista</h2>
            <p className="text-[12px] text-[var(--text-muted)]">
              Este bloque después se conecta con compra y venta.
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
                  ? `Actualizado ${new Date(
                      selectedPrice.updatedAt,
                    ).toLocaleString()}`
                  : "Sin selección"}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-widest text-[var(--text-faint)]">
                Precio actual
              </p>
              <p className="mt-1 font-mono text-[18px] font-bold text-[var(--text)]">
                {!selectedPrice
                  ? "Sin precio"
                  : `$${selectedPrice.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Batch: {lastPriceRunQuery.data?.finishedAt ?? "sin actualizar"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!selectedPrice}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowDownLeft size={15} />
                Comprar
              </button>
              <button
                type="button"
                disabled={!selectedPrice}
                className="flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 py-3 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowUpRight size={15} />
                Vender
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
