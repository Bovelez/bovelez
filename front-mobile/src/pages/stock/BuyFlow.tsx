import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Minus, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useStockPrice } from "../../hooks/prices/useStockPrice";
import { useEdgarCompany } from "../../hooks/edgar/useEdgarCompany";
import { useBuyTransaction } from "../../hooks/transactions/useBuyTransaction";
import { buildTransactionInput, todayInputValue, transactionErrorLabel } from "../../hooks/transactions/utils/transaction.utils";

export default function BuyFlow() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate   = useNavigate();
  const priceQuery   = useStockPrice(ticker ?? null);
  const companyQuery = useEdgarCompany(ticker ?? null);
  const buyMutation  = useBuyTransaction();

  const [qty, setQty]           = useState(1);
  const [date, setDate]         = useState(todayInputValue);
  const [confirmed, setConfirmed] = useState(false);

  const price   = priceQuery.data;
  const company = companyQuery.data;
  const total   = qty * (price?.price ?? 0);
  const txnId   = useMemo(() => "TXN-" + Math.floor(Math.random() * 90000 + 10000), []);
  const errorMsg = transactionErrorLabel(buyMutation.error);

  function handleConfirm() {
    const input = buildTransactionInput({ date, quantity: String(qty), selectedPrice: price ?? null });
    if (!input) return;
    buyMutation.mutate(input, { onSuccess: () => setConfirmed(true) });
  }

  if (priceQuery.isLoading || companyQuery.isLoading) {
    return (
      <div data-testid="buyflow-loading" className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!price || !company) {
    return (
      <div data-testid="buyflow-error" className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <AlertTriangle size={32} className="text-[var(--primary)]" />
        <p className="text-[var(--text)] text-center">No se encontró información para <strong>{ticker}</strong>.</p>
        <button data-testid="buyflow-back-btn" onClick={() => navigate(-1)}
          className="rounded-xl border border-[var(--border-strong)] px-5 py-3 text-sm text-[var(--text-muted)]">Volver</button>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div data-testid="buyflow-confirmed" className="flex min-h-screen items-center justify-center p-6" style={{ fontFamily: "var(--font-body)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-500/15">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-emerald-400 mb-1 text-2xl font-bold">Compra registrada</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">La operación se registró en tu portfolio</p>

          <div className="p-5 rounded-2xl text-left mb-5 bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
            {[
              { label: "Ticker",          v: company.ticker },
              { label: "Cantidad",        v: `${qty} acciones` },
              { label: "Precio unitario", v: `$${price.price.toFixed(2)}` },
              { label: "Total invertido", v: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, hl: true },
              { label: "N° operación",    v: txnId },
            ].map(({ label, v, hl }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">{label}</span>
                <span className={`text-sm font-mono font-semibold ${hl ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{v}</span>
              </div>
            ))}
          </div>

          <button data-testid="buyflow-go-portfolio" onClick={() => navigate("/app/portfolio")}
            className="w-full py-4 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--gradient-brand)" }}>
            Ver portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="buyflow-page" className="min-h-screen pb-8" style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--border)]">
        <button data-testid="buyflow-back-btn" onClick={() => navigate(-1)} className="p-2 rounded-xl bg-[var(--surface)]">
          <ArrowLeft size={18} className="text-[var(--text)]" />
        </button>
        <div>
          <p className="font-semibold text-[var(--text)]">Comprar {company.ticker}</p>
          <p className="text-xs text-[var(--text-muted)]">Precio actual: ${price.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Quantity */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">Cantidad de acciones</p>
          <div className="flex items-center gap-3">
            <button data-testid="buyflow-qty-minus" onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-deep)] border border-[var(--border-strong)] text-[var(--text)]">
              <Minus size={18} />
            </button>
            <input
              data-testid="buyflow-qty-input"
              type="number" value={qty} min={1}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center font-mono font-bold py-3 rounded-xl outline-none border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] text-xl"
            />
            <button data-testid="buyflow-qty-plus" onClick={() => setQty(qty + 1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              style={{ background: "var(--gradient-brand)" }}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <p className="font-semibold mb-3 text-[var(--text)]">Fecha de la operación</p>
          <input data-testid="buyflow-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl outline-none font-mono border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--primary)]" />
        </div>

        {/* Total */}
        <div className="p-5 rounded-2xl text-center border-2" style={{ backgroundColor: "var(--primary-soft)", borderColor: "rgba(255,107,53,0.25)" }}>
          <p className="text-sm mb-1 text-[var(--text-faint)]">Total a invertir</p>
          <p data-testid="buyflow-total" className="font-mono font-bold text-[var(--primary)] text-4xl">
            ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs mt-1 text-[var(--text-faint)]">{qty} × ${price.price.toFixed(2)}</p>
        </div>

        {errorMsg && (
          <div data-testid="buyflow-error-msg" className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertTriangle size={15} />{errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-xl text-sm font-semibold border border-[var(--border-strong)] text-[var(--text-muted)]">
            Cancelar
          </button>
          <button data-testid="buyflow-confirm-btn" onClick={handleConfirm}
            disabled={buyMutation.isPending || qty < 1 || !date}
            className="flex-1 py-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}>
            {buyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            {buyMutation.isPending ? "Registrando..." : "Confirmar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}
