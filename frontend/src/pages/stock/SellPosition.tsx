import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle, Loader2 } from "lucide-react";
import { useStockPrice } from "../../hooks/prices/useStockPrice";
import { useEdgarCompany } from "../../hooks/edgar/useEdgarCompany";
import { usePortfolio } from "../../hooks/portfolio/usePortfolio";
import { useSellTransaction } from "../../hooks/transactions/useSellTransaction";
import { buildTransactionInput, todayInputValue, transactionErrorLabel } from "../../hooks/transactions/utils/transaction.utils";

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
  const position = portfolioQuery.data?.positions.find((p) => p.ticker === ticker);

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
    const input = buildTransactionInput({ date, quantity: String(qty), selectedPrice: price });
    if (!input) return;
    sellMutation.mutate(input, { onSuccess: () => setConfirmed(true) });
  }

  const isLoading = priceQuery.isLoading || companyQuery.isLoading || portfolioQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ fontFamily: "var(--font-body)" }}>
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!price || !company) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4" style={{ fontFamily: "var(--font-body)" }}>
        <AlertTriangle size={32} className="text-[var(--primary)]" />
        <p className="text-[var(--text)]">No se encontró información para <strong>{ticker}</strong>.</p>
        <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text-muted)]">
          Volver
        </button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div
        className="flex-1 flex items-center justify-center p-8 relative overflow-hidden min-h-full"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full opacity-60"
          style={{ background: "var(--glow-orange)", filter: "blur(70px)" }}
        />
        <div className="w-full max-w-md text-center relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-500/15">
            <CheckCircle size={44} className="text-emerald-400" />
          </div>
          <h2 className="text-emerald-400 mb-1" style={{ fontSize: 28 }}>Venta registrada</h2>
          <p className="text-[var(--text-muted)] text-[13px] mb-6">
            La operación se registró en tu portfolio
          </p>

          <div className="p-6 rounded-2xl text-left mb-6 bg-[var(--surface)] border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-[13px] text-[var(--primary)]"
                style={{ backgroundColor: "var(--primary-soft)" }}
              >
                {company.ticker.slice(0, 2)}
              </div>
              <div>
                <p className="font-mono font-semibold text-[var(--text)]">{company.ticker}</p>
                <p className="text-xs text-[var(--text-muted)]">{company.name}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Cantidad vendida", v: `${qty} acciones` },
                { label: "Precio de venta", v: `$${sellPrice.toFixed(2)}` },
                { label: "Total recibido", v: `$${totalReceive.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, hl: true },
                { label: "Fecha", v: date },
              ].map(({ label, v, hl }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
                  <span className={`text-[13px] font-mono font-semibold ${hl ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                    {v}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-muted)]">G/P realizada</span>
                <span className={`text-[13px] font-mono font-semibold flex items-center gap-1 ${isLoss ? "text-rose-400" : "text-emerald-400"}`}>
                  {isLoss ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {isLoss ? "" : "+"}{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/app/portfolio")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text)]"
            >
              Nueva operación
            </button>
            <button
              onClick={() => navigate("/app/portfolio")}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              Ver portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 relative" style={{ fontFamily: "var(--font-body)" }}>
      <div
        className="pointer-events-none absolute -top-24 left-1/3 w-[420px] h-[420px] rounded-full opacity-60"
        style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
      />

      <div className="max-w-2xl mx-auto relative">
        <h2 className="mb-2 text-[var(--text)]" style={{ fontSize: 26 }}>Vender Posición</h2>
        <p className="text-sm mb-8 text-[var(--text-muted)]">Confirmá los detalles de tu venta</p>

        {/* Position detail */}
        <div className="p-6 rounded-2xl mb-5 bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-[var(--primary)]"
              style={{ backgroundColor: "var(--primary-soft)" }}
            >
              {company.ticker.slice(0, 2)}
            </div>
            <div>
              <p className="font-mono font-semibold text-[var(--primary)]">{company.ticker}</p>
              <p className="text-xs text-[var(--text-muted)]">{company.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tenencia", v: maxQty > 0 ? `${maxQty} acciones` : "Sin posición" },
              { label: "Precio promedio", v: avgCost > 0 ? `$${avgCost.toFixed(2)}` : "—" },
              { label: "Precio actual", v: `$${sellPrice.toFixed(2)}` },
            ].map(({ label, v }) => (
              <div key={label} className="p-3 rounded-xl text-center bg-[var(--bg-deep)]">
                <p className="text-xs mb-1 text-[var(--text-faint)]">{label}</p>
                <p className="font-bold font-mono text-[var(--text)]">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* No position warning */}
        {maxQty === 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl mb-5 border"
            style={{ backgroundColor: "var(--primary-soft)", borderColor: "rgba(255,107,53,0.35)" }}
          >
            <AlertTriangle size={18} className="text-[var(--primary)]" />
            <p className="text-sm font-semibold text-[var(--primary)]">
              No tenés acciones de {company.ticker} en tu portfolio.
            </p>
          </div>
        )}

        {/* Loss warning */}
        {isLoss && maxQty > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl mb-5 border"
            style={{ backgroundColor: "var(--primary-soft)", borderColor: "rgba(255,107,53,0.35)" }}
          >
            <AlertTriangle size={18} className="text-[var(--primary)]" />
            <p className="text-sm font-semibold text-[var(--primary)]">
              Vendiendo con pérdida del {Math.abs(pnlPct).toFixed(2)}% · Considerá esperar una mejor oportunidad.
            </p>
          </div>
        )}

        {/* Quantity selector */}
        <div className="p-5 rounded-2xl mb-5 bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">Cantidad a vender</p>
          <div className="flex items-center gap-4 mb-3">
            <input
              type="range"
              min={1}
              max={Math.max(1, maxQty)}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              className="flex-1 accent-[var(--primary)]"
              disabled={maxQty === 0}
            />
            <span className="w-16 text-center font-bold py-1.5 rounded-lg font-mono bg-[var(--bg-deep)] text-[var(--text)]">
              {qty}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-faint)]">
            <span>1 acción (parcial)</span>
            <span>{maxQty} acciones (total)</span>
          </div>
        </div>

        {/* Date */}
        <div className="p-5 rounded-2xl mb-5 bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">Fecha de la operación</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm font-mono border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--primary)]"
          />
        </div>

        {/* Sale summary */}
        <div
          className={`p-5 rounded-2xl mb-6 border ${
            isLoss ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
          }`}
        >
          <p className="text-sm font-semibold mb-3 text-[var(--text)]">Resumen de venta</p>
          <div className="space-y-2">
            {[
              { label: "Cantidad", v: `${qty} acciones` },
              { label: "Precio de venta", v: `$${sellPrice.toFixed(2)}` },
              { label: "Total a recibir", v: `$${totalReceive.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
            ].map(({ label, v }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">{label}</span>
                <span className="text-sm font-bold font-mono text-[var(--text)]">{v}</span>
              </div>
            ))}
            <div className={`h-px ${isLoss ? "bg-rose-500/20" : "bg-emerald-500/20"}`} />
            <div className="flex justify-between">
              <span className="text-sm font-semibold text-[var(--text)]">Ganancia / Pérdida realizada</span>
              <span
                className={`text-sm font-bold flex items-center gap-1 font-mono ${
                  isLoss ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {!isLoss ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {isLoss ? "" : "+"}{pnl.toFixed(2)} ({pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertTriangle size={15} />
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[var(--border-strong)] text-[var(--text-muted)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={sellMutation.isPending || maxQty === 0 || qty < 1 || !date}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {sellMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ArrowDownRight size={15} />
            )}
            {sellMutation.isPending ? "Registrando..." : "Confirmar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
