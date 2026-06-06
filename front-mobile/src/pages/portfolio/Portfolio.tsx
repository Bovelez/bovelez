import { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  BriefcaseBusiness,
  History,
} from 'lucide-react';
import { PnlBadge, PnlText } from '../../components/ui/PnlBadge';
import { TransactionPanel } from '../../components/transactions/TransactionPanel';
import { TickerTransactionsDialog } from '../../components/transactions/TickerTransactionsDialog';
import { PriceTickerSelect } from '../../components/prices/PriceTickerSelect';
import { usePortfolio } from '../../hooks/portfolio/usePortfolio';
import { useLastPriceRun } from '../../hooks/prices/useLastPriceRun';
import { useStockPrices } from '../../hooks/prices/useStockPrices';
import { useErrorLabel } from '../../hooks/portfolio/utils/useErrorLabel';
import { useMoney } from '../../hooks/transactions/utils/useMoney';
import type { StockPrice } from '../../types/prices.types';
import type { PortfolioPosition } from '../../types/portfolio.types';

export default function Portfolio() {
  const portfolioQuery = usePortfolio();
  const pricesQuery = useStockPrices();
  const lastPriceRunQuery = useLastPriceRun();
  const prices = pricesQuery.data ?? [];
  const [selectedPrice, setSelectedPrice] = useState<StockPrice | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  const portfolioError = useErrorLabel(portfolioQuery.error);
  const positions = portfolioQuery.data?.positions ?? [];
  const totalValue = portfolioQuery.data?.totalValue ?? 0;
  const totalPnl = portfolioQuery.data?.totalPnl ?? 0;
  const totalPnlPct = portfolioQuery.data?.totalPnlPercent ?? 0;
  const isLoading = portfolioQuery.isLoading;
  const isPnlPositive = totalPnl >= 0;

  const selectedPosition: PortfolioPosition | null = selectedTicker
    ? (positions.find((p) => p.ticker === selectedTicker) ?? null)
    : null;

  return (
    <div
      data-testid="portfolio-page"
      className="pb-4 text-[var(--text)]"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
            <TrendingUp size={17} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--text)]">
            Mi Portfolio
          </h1>
        </div>

        <div className="flex gap-3">
          {/* Account value */}
          <div className="flex-1 flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <Wallet size={15} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-100/80">
                Valor
              </p>
              <p
                data-testid="portfolio-total-value"
                className="font-mono text-lg font-black text-[var(--text)]"
              >
                {isLoading
                  ? '···'
                  : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

          {/* PnL */}
          {!isLoading && (
            <div
              className="flex-1 flex items-center gap-2 rounded-2xl border px-4 py-3"
              style={{
                background: 'var(--surface)',
                borderColor: isPnlPositive
                  ? 'rgba(52,211,153,0.2)'
                  : 'rgba(251,113,133,0.2)',
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                style={{
                  background: isPnlPositive
                    ? 'rgba(52,211,153,0.1)'
                    : 'rgba(251,113,133,0.1)',
                }}
              >
                {isPnlPositive ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownLeft size={14} className="text-rose-400" />
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-orange-100/80">
                  Resultado
                </p>
                <p
                  className="font-mono text-sm font-black"
                  style={{ color: isPnlPositive ? '#34d399' : '#fb7185' }}
                >
                  {isPnlPositive ? '+' : ''}$
                  {Math.abs(totalPnl).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Positions cards ── */}
      <section
        data-testid="active-shares"
        className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-4"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <BriefcaseBusiness size={16} className="text-indigo-400" />
          <h2 className="text-sm font-black text-[var(--text)]">Tus Activos</h2>
          {!isLoading && (
            <div className="ml-auto flex gap-2">
              <PnlBadge value={totalPnl} format="currency" />
              <PnlBadge value={totalPnlPct} format="percent" />
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Cargando posiciones…
          </div>
        )}

        {!isLoading && portfolioError && (
          <p className="px-4 py-6 text-sm text-rose-400">{portfolioError}</p>
        )}

        {!isLoading && !portfolioError && positions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
            <BriefcaseBusiness
              size={28}
              className="text-[var(--text-muted)]"
              opacity={0.4}
            />
            <p className="text-sm font-semibold text-[var(--text)]">
              Sin posiciones abiertas
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Usá el terminal para tu primera compra.
            </p>
          </div>
        )}

        {!isLoading &&
          !portfolioError &&
          positions.map((position) => {
            const isPositive = (position.pnl ?? 0) >= 0;
            return (
              <div
                key={position.ticker}
                data-testid={`position-row-${position.ticker}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTicker(position.ticker)}
                className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)] last:border-0 active:bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[11px] font-black text-[var(--text)]">
                    {position.ticker.slice(0, 3)}
                  </div>
                  <div>
                    <p
                      data-testid={`position-ticker-${position.ticker}`}
                      className="font-mono text-sm font-black text-[var(--text)]"
                    >
                      {position.ticker}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {position.quantity} acc. · PPC{' '}
                      {useMoney(position.avgCost)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-[var(--text)]">
                      {useMoney(position.currentPrice)}
                    </p>
                    {position.pnlPercent !== null ? (
                      <PnlText
                        value={position.pnlPercent}
                        format="percent"
                        data-testid={`position-pct-${position.ticker}`}
                      />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">
                        —
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--text-faint)]">
                    <History
                      size={16}
                      className={
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }
                    />
                  </span>
                </div>
              </div>
            );
          })}
      </section>

      {/* ── Terminal toggle ── */}
      <div className="px-4 mb-4">
        <button
          data-testid="toggle-terminal"
          onClick={() => setShowTerminal((v) => !v)}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{
            background: 'var(--gradient-brand)',
            boxShadow: '0 4px 14px rgba(255,107,53,0.25)',
          }}
        >
          {showTerminal ? 'Cerrar terminal' : 'Abrir terminal de operaciones'}
        </button>
      </div>

      {/* ── Trading terminal ── */}
      {showTerminal && (
        <div className="mx-4 mb-4 flex flex-col gap-3">
          <PriceTickerSelect
            prices={prices}
            selectedPrice={selectedPrice}
            isLoading={pricesQuery.isLoading}
            errorMessage={useErrorLabel(pricesQuery.error)}
            onSelectPrice={setSelectedPrice}
            onClearSelection={() => setSelectedPrice(null)}
          />
          <TransactionPanel
            selectedPrice={selectedPrice}
            lastPriceRunFinishedAt={lastPriceRunQuery.data?.finishedAt}
          />
        </div>
      )}

      {/* ── Ticker history dialog ── */}
      <TickerTransactionsDialog
        open={Boolean(selectedPosition)}
        position={selectedPosition}
        onOpenChange={(open) => {
          if (!open) setSelectedTicker(null);
        }}
      />
    </div>
  );
}
