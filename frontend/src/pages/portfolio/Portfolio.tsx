import { useState } from "react";
import { ActiveShares } from "../../components/portfolio/ActiveShares";
import { PriceTickerSelect } from "../../components/prices/PriceTickerSelect";
import { TransactionPanel } from "../../components/transactions/TransactionPanel";
import { usePortfolio } from "../../hooks/portfolio/usePortfolio";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import type { StockPrice } from "../../types/prices.types";

function errorLabel(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  return "No pudimos cargar los precios.";
}

export default function Portfolio() {
  const portfolioQuery = usePortfolio();
  const pricesQuery = useStockPrices();
  const lastPriceRunQuery = useLastPriceRun();
  const prices = pricesQuery.data ?? [];
  const [selectedPrice, setSelectedPrice] = useState<StockPrice | null>(null);
  const marketError = errorLabel(pricesQuery.error);
  const portfolioError = errorLabel(portfolioQuery.error);

  return (
    <div
      data-testid="portfolio-page"
      className="relative min-h-screen p-6 md:p-8 lg:p-12 text-[var(--text)] font-sans selection:bg-[var(--primary)]/30"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[120px]" />

      <header className="relative z-10 mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)]/50 bg-[var(--surface-2)]/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Live Trading Environment
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)] drop-shadow-sm md:text-5xl lg:text-6xl">
            Portfolio & Trading
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
            Gestioná tus inversiones S&P 500 de forma inteligente. Explorá el
            mercado, operá acciones al instante y monitoreá tus rendimientos en
            tiempo real con una interfaz profesional.
          </p>
        </div>

        <div className="flex items-center gap-6 rounded-3xl border border-[var(--border)]/50 bg-[var(--surface)]/40 p-5 shadow-2xl backdrop-blur-xl">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              Valor de la Cuenta
            </p>
            <p className="font-mono text-3xl font-bold text-[var(--text)] md:text-4xl">
              {portfolioQuery.isLoading
                ? "..."
                : `$${(portfolioQuery.data?.totalValue ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col gap-8">
        <ActiveShares
          portfolio={portfolioQuery.data}
          isLoading={portfolioQuery.isLoading}
          errorMessage={portfolioError}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:gap-8 xl:grid-cols-[1fr_440px]">
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
      </main>
    </div>
  );
}
