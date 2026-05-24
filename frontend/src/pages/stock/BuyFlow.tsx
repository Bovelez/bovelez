import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowUpRight, Plus, Minus, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useStockPrice } from "../../hooks/prices/useStockPrice";
import { useEdgarCompany } from "../../hooks/edgar/useEdgarCompany";
import { useBuyTransaction } from "../../hooks/transactions/useBuyTransaction";
import { buildTransactionInput, todayInputValue, transactionErrorLabel } from "../../hooks/transactions/transaction.utils";

export default function BuyFlow() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const priceQuery = useStockPrice(ticker ?? null);
  const companyQuery = useEdgarCompany(ticker ?? null);
  const buyMutation = useBuyTransaction();

  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(todayInputValue);
  const [confirmed, setConfirmed] = useState(false);

  const price = priceQuery.data;
  const company = companyQuery.data;
  const total = qty * (price?.price ?? 0);

  const txnId = useMemo(() => "TXN-" + Math.floor(Math.random() * 90000 + 10000), []);

  function handleConfirm() {
    const input = buildTransactionInput({ date, quantity: String(qty), selectedPrice: price ?? null });
    if (!input) return;
    buyMutation.mutate(input, { onSuccess: () => setConfirmed(true) });
  }

  const errorMsg = transactionErrorLabel(buyMutation.error);

  if (priceQuery.isLoading || companyQuery.isLoading) {
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
          <h2 className="text-emerald-400 mb-1" style={{ fontSize: 28 }}>Compra registrada</h2>
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
                { label: "Cantidad", v: `${qty} acciones` },
                { label: "Precio unitario", v: `$${price.price.toFixed(2)}` },
                { label: "Total invertido", v: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, hl: true },
                { label: "Fecha", v: date },
                { label: "N° de operación", v: txnId },
              ].map(({ label, v, hl }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
                  <span className={`text-[13px] font-mono font-semibold ${hl ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                    {v}
                  </span>
                </div>
              ))}
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

      <div className="mb-6 relative">
        <h1 className="text-[var(--text)]" style={{ fontSize: 24 }}>Comprar {company.ticker}</h1>
        <p className="text-[var(--text-muted)] text-[13px]">
          Registrá la operación al precio vigente del último batch
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 relative">
        {/* Left: Order Summary */}
        <div className="col-span-1 p-6 rounded-2xl sticky top-4 self-start bg-[var(--surface)] border border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-[var(--text-faint)]">
            Resumen de Compra
          </p>

          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
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

          <div className="space-y-3">
            {[
              { label: "Precio actual", v: `$${price.price.toFixed(2)}` },
              { label: "Cantidad", v: `${qty} acciones` },
              { label: "Comisión", v: "$0.00" },
              { label: "Fecha", v: date },
            ].map(({ label, v }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">{label}</span>
                <span className="text-sm font-semibold font-mono text-[var(--text)]">{v}</span>
              </div>
            ))}
            <div className="h-px bg-[var(--border)]" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--text)]">Total a invertir</span>
              <span className="font-mono font-bold text-[var(--primary)]" style={{ fontSize: 20 }}>
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Form */}
        <div className="col-span-1 space-y-5">
          {/* Quantity */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <p className="font-semibold mb-3 text-[var(--text)]">Cantidad de acciones</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-deep)] border border-[var(--border-strong)] text-[var(--text)]"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={qty}
                min={1}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-center font-mono font-bold py-2 rounded-xl outline-none border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)]"
                style={{ fontSize: 20 }}
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <p className="font-semibold mb-3 text-[var(--text)]">Fecha de la operación</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm font-mono border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--primary)]"
            />
          </div>

          {/* Total highlight */}
          <div
            className="p-5 rounded-2xl text-center border-2"
            style={{ backgroundColor: "var(--primary-soft)", borderColor: "rgba(255,107,53,0.25)" }}
          >
            <p className="text-sm mb-1 text-[var(--text-faint)]">Total a invertir</p>
            <p className="font-mono font-bold text-[var(--primary)]" style={{ fontSize: 36 }}>
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs mt-1 text-[var(--text-faint)]">{qty} × ${price.price.toFixed(2)}</p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
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
              disabled={buyMutation.isPending || qty < 1 || !date}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
            >
              {buyMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowUpRight size={15} className="text-emerald-300" />
              )}
              {buyMutation.isPending ? "Registrando..." : "Confirmar compra"}
            </button>
          </div>
        </div>

        {/* Right: Price info */}
        <div className="col-span-1">
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <p className="font-semibold mb-1 text-sm text-[var(--text)]">{company.ticker} · Precio actual</p>
            <p className="text-xs mb-4 text-[var(--text-muted)]">
              Precio del último batch:{" "}
              <strong className="text-[var(--primary)] font-mono">${price.price.toFixed(2)}</strong>
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-faint)] mb-1">Último precio</p>
                <p className="font-mono font-bold text-[var(--text)]" style={{ fontSize: 22 }}>
                  ${price.price.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-faint)] mb-1">Actualizado</p>
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {new Date(price.updatedAt).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)]">
                <p className="text-xs text-[var(--text-faint)] mb-1">Empresa</p>
                <p className="text-xs text-[var(--text-muted)]">{company.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
