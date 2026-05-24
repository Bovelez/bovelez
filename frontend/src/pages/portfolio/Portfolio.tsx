import { useState } from "react";
import { ActiveShares } from "../../components/portfolio/ActiveShares";
import { PriceTickerSelect } from "../../components/prices/PriceTickerSelect";
import { StockTickerBar } from "../../components/prices/StockTickerBar";
import { TransactionPanel } from "../../components/transactions/TransactionPanel";
import { usePortfolio } from "../../hooks/portfolio/usePortfolio";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import type { StockPrice } from "../../types/prices.types";
import { useErrorLabel } from "../../hooks/portfolio/utils/useErrorLabel.ts";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function Portfolio() {
  const portfolioQuery = usePortfolio();
  const pricesQuery = useStockPrices();
  const lastPriceRunQuery = useLastPriceRun();
  const prices = pricesQuery.data ?? [];
  const [selectedPrice, setSelectedPrice] = useState<StockPrice | null>(null);
  const marketError = useErrorLabel(pricesQuery.error);
  const portfolioError = useErrorLabel(portfolioQuery.error);

  const totalValue = portfolioQuery.data?.totalValue ?? 0;
  const totalPnl = portfolioQuery.data?.totalPnl ?? 0;
  const totalPnlPercent = portfolioQuery.data?.totalPnlPercent ?? 0;
  const isLoading = portfolioQuery.isLoading;
  const isPnlPositive = totalPnl >= 0;

  return (
      <div
          data-testid="portfolio-page"
          className="relative min-h-screen font-sans selection:bg-orange-500/20"
          style={{ color: "var(--text, #f0ede8)" }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none fixed -left-64 -top-64 h-[700px] w-[700px] rounded-full bg-orange-500/[0.06] blur-[100px]" />
        <div className="pointer-events-none fixed bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-600/[0.04] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[1520px] px-4 py-6 md:px-8 lg:py-8">

          {/* ── HEADER ── */}
          <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
                <TrendingUp size={19} strokeWidth={2.5} className="text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black tracking-tight text-[var(--text)]">
                  Mi Portfolio
                </h1>
                <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-100/80">
                  Live · S&amp;P 500
                </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3">
              {/* Account value */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[var(--surface)]/60 px-5 py-3.5 shadow-xl backdrop-blur-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
                  <Wallet size={17} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-100/80">
                    Valor de Cuenta
                  </p>
                  <p className="font-mono text-[22px] font-black tabular-nums text-[var(--text)]">
                    {isLoading
                        ? "···"
                        : `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
              </div>

              {/* PnL */}
              {!isLoading && (
                  <div
                      className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-xl backdrop-blur-md"
                      style={{
                        background: "var(--surface, #141414)",
                        borderColor: isPnlPositive ? "rgba(52,211,153,0.18)" : "rgba(251,113,133,0.18)",
                      }}
                  >
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: isPnlPositive ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)" }}
                    >
                      {isPnlPositive
                          ? <ArrowUpRight size={17} className="text-emerald-400" />
                          : <ArrowDownLeft size={17} className="text-rose-400" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-100/80">
                        Resultado Neto
                      </p>
                      <div className="flex items-baseline gap-2">
                    <span
                        className="font-mono text-[18px] font-black tabular-nums"
                        style={{ color: isPnlPositive ? "#34d399" : "#fb7185" }}
                    >
                      {isPnlPositive ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                        <span
                            className="font-mono text-xs font-bold"
                            style={{ color: isPnlPositive ? "#6ee7b7" : "#fda4af" }}
                        >
                      {isPnlPositive ? "+" : ""}{totalPnlPercent.toFixed(2)}%
                    </span>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </header>

          {/* ── TICKER BAR ── */}
          <div className="mb-6">
            <StockTickerBar />
          </div>

          {/* ── ACTIVE SHARES ── */}
          <div className="mb-6">
            <ActiveShares
                portfolio={portfolioQuery.data}
                isLoading={portfolioQuery.isLoading}
                errorMessage={portfolioError}
            />
          </div>

          {/* ── SECTION DIVIDER ── */}
          <div className="mb-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-orange-500/30 via-orange-500/10 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-100/80">
            Terminal de Operaciones
          </span>
            <div className="h-px flex-1 bg-gradient-to-l from-orange-500/30 via-orange-500/10 to-transparent" />
          </div>

          {/* ── TRADING PANEL ── */}
          <div className="grid gap-5 lg:grid-cols-[1fr_430px] xl:grid-cols-[1fr_460px]">
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
      </div>
  );
}
