import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useStockPrice } from '../../hooks/prices/useStockPrice';
import { useEdgarCompany } from '../../hooks/edgar/useEdgarCompany';
import { usePortfolio } from '../../hooks/portfolio/usePortfolio';
import { useSellTransaction } from '../../hooks/transactions/useSellTransaction';
import {
  buildTransactionInput,
  todayInputValue,
  transactionErrorLabel,
} from '../../hooks/transactions/utils/transaction.utils';

export default function SellPosition() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const priceQuery = useStockPrice(ticker ?? null);
  const companyQuery = useEdgarCompany(ticker ?? null);
  const portfolioQuery = usePortfolio();
  const sellMutation = useSellTransaction();

  const [date, setDate] = useState(todayInputValue);
  const [confirmed, setConfirmed] = useState(false);

  const price = priceQuery.data;
  const company = companyQuery.data;
  const position = portfolioQuery.data?.positions.find(
    (p) => p.ticker === ticker,
  );
  const maxQty = position?.quantity ?? 0;
  const avgCost = position?.avgCost ?? 0;

  const [qty, setQty] = useState(Math.max(1, Math.floor(maxQty / 2)));

  const sellPrice = price?.price ?? 0;
  const totalReceive = qty * sellPrice;
  const pnl = (sellPrice - avgCost) * qty;
  const pnlPct = avgCost > 0 ? ((sellPrice - avgCost) / avgCost) * 100 : 0;
  const isLoss = pnl < 0;
  const errorMsg = transactionErrorLabel(sellMutation.error);

  function handleConfirm() {
    if (!price) return;
    const input = buildTransactionInput({
      date,
      quantity: String(qty),
      selectedPrice: price,
    });
    if (!input) return;
    sellMutation.mutate(input, { onSuccess: () => setConfirmed(true) });
  }

  const isLoading =
    priceQuery.isLoading || companyQuery.isLoading || portfolioQuery.isLoading;

  if (isLoading) {
    return (
      <div
        data-testid="sell-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!price || !company) {
    return (
      <div
        data-testid="sell-error"
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
      >
        <AlertTriangle size={32} className="text-[var(--primary)]" />
        <p className="text-[var(--text)] text-center">
          No se encontró información para <strong>{ticker}</strong>.
        </p>
        <button
          data-testid="sell-back-btn"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-[var(--border-strong)] px-5 py-3 text-sm text-[var(--text-muted)]"
        >
          Volver
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div
        data-testid="sell-confirmed"
        className="flex min-h-screen items-center justify-center p-6"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-500/15">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-emerald-400 mb-1 text-2xl font-bold">
            Venta registrada
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            La operación se registró en tu portfolio
          </p>
          <div className="p-5 rounded-2xl text-left mb-5 bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
            {[
              { label: 'Ticker', v: company.ticker },
              { label: 'Cantidad vendida', v: `${qty} acciones` },
              { label: 'Precio de venta', v: `$${sellPrice.toFixed(2)}` },
              {
                label: 'Total recibido',
                v: `$${totalReceive.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                hl: true,
              },
            ].map(({ label, v, hl }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">
                  {label}
                </span>
                <span
                  className={`text-sm font-mono font-semibold ${hl ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <button
            data-testid="sell-go-portfolio"
            onClick={() => navigate('/app/portfolio')}
            className="w-full py-4 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--gradient-brand)' }}
          >
            Ver portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="sell-page"
      className="min-h-screen pb-8"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--border)]">
        <button
          data-testid="sell-back-btn"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[var(--surface)]"
        >
          <ArrowLeft size={18} className="text-[var(--text)]" />
        </button>
        <div>
          <p className="font-semibold text-[var(--text)]">
            Vender {company.ticker}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tenés {maxQty} acciones · Precio: ${sellPrice.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {maxQty === 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--primary-soft)',
              borderColor: 'rgba(255,107,53,0.35)',
            }}
          >
            <AlertTriangle size={18} className="text-[var(--primary)]" />
            <p className="text-sm font-semibold text-[var(--primary)]">
              No tenés acciones de {company.ticker}.
            </p>
          </div>
        )}

        {isLoss && maxQty > 0 && (
          <div
            data-testid="sell-loss-warning"
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--primary-soft)',
              borderColor: 'rgba(255,107,53,0.35)',
            }}
          >
            <AlertTriangle size={18} className="text-[var(--primary)]" />
            <p className="text-sm font-semibold text-[var(--primary)]">
              Vendiendo con pérdida del {Math.abs(pnlPct).toFixed(2)}%.
            </p>
          </div>
        )}

        {/* Quantity slider */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">
            Cantidad a vender
          </p>
          <input
            data-testid="sell-qty-slider"
            type="range"
            min={1}
            max={Math.max(1, maxQty)}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value))}
            className="w-full accent-[var(--primary)] mb-3"
            disabled={maxQty === 0}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-faint)]">1 acción</span>
            <span
              data-testid="sell-qty-display"
              className="font-bold font-mono text-lg text-[var(--text)]"
            >
              {qty}
            </span>
            <span className="text-xs text-[var(--text-faint)]">
              {maxQty} acciones
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">
            Fecha de la operación
          </p>
          <input
            data-testid="sell-date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl outline-none font-mono border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--primary)]"
          />
        </div>

        {/* Summary */}
        <div
          className={`p-5 rounded-2xl border ${isLoss ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}
        >
          <p className="text-sm font-semibold mb-3 text-[var(--text)]">
            Resumen de venta
          </p>
          <div className="space-y-2">
            {[
              { label: 'Cantidad', v: `${qty} acciones` },
              { label: 'Precio de venta', v: `$${sellPrice.toFixed(2)}` },
              {
                label: 'Total a recibir',
                v: `$${totalReceive.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              },
            ].map(({ label, v }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">
                  {label}
                </span>
                <span className="text-sm font-bold font-mono text-[var(--text)]">
                  {v}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-sm text-[var(--text-muted)]">
                G/P realizada
              </span>
              <span
                data-testid="sell-pnl"
                className={`text-sm font-bold flex items-center gap-1 font-mono ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}
              >
                {!isLoss ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {isLoss ? '' : '+'}
                {pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            data-testid="sell-error-msg"
            className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
          >
            <AlertTriangle size={15} />
            {errorMsg}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-xl text-sm font-semibold border border-[var(--border-strong)] text-[var(--text-muted)]"
          >
            Cancelar
          </button>
          <button
            data-testid="sell-confirm-btn"
            onClick={handleConfirm}
            disabled={
              sellMutation.isPending || maxQty === 0 || qty < 1 || !date
            }
            className="flex-1 py-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-rose-500 disabled:opacity-50"
          >
            {sellMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : null}
            {sellMutation.isPending ? 'Registrando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}
