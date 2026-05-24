import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, ArrowDownRight, Plus, Minus, Star } from "lucide-react";
import type { StockPrice } from "../../types/prices.types";
import type { EdgarCompanyRecord } from "../../types/edgar.types";

type Props = {
  company: EdgarCompanyRecord;
  price: StockPrice | undefined;
};

export function QuickAction({ company, price }: Props) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [inWatchlist, setInWatchlist] = useState(false);

  return (
    <div className="p-5 rounded-2xl sticky top-4 bg-[var(--surface)] border border-[var(--border)]">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[var(--text-faint)]">
        Acción Rápida
      </p>
      <p className="mb-4 font-mono font-bold text-[var(--primary)]" style={{ fontSize: 28 }}>
        {price ? `$${price.price.toFixed(2)}` : "—"}
      </p>

      <p className="text-xs font-semibold mb-2 text-[var(--text)]">Cantidad</p>
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-deep)] border border-[var(--border-strong)]"
        >
          <Minus size={14} className="text-[var(--text)]" />
        </button>
        <span className="flex-1 text-center font-bold font-mono text-[var(--text)]">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-deep)] border border-[var(--border-strong)]"
        >
          <Plus size={14} className="text-[var(--text)]" />
        </button>
      </div>

      <p className="text-xs mb-1 text-[var(--text-faint)]">Total estimado</p>
      <p className="font-bold mb-4 font-mono text-[var(--text)]" style={{ fontSize: 15 }}>
        {price
          ? `$${(qty * price.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : "—"}
      </p>

      <button
        onClick={() => navigate(`/app/buy/${company.ticker}`)}
        className="w-full py-2.5 rounded-lg font-semibold text-white text-sm flex items-center justify-center gap-1.5 mb-2"
        style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
      >
        <ArrowUpRight size={14} className="text-emerald-300" /> Comprar
      </button>
      <button
        onClick={() => navigate(`/app/sell/${company.ticker}`)}
        className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)]"
      >
        <ArrowDownRight size={14} className="text-rose-400" /> Vender
      </button>

      <button
        onClick={() => setInWatchlist(!inWatchlist)}
        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${
          inWatchlist
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-[var(--border-strong)] text-[var(--text-muted)] bg-[var(--surface)]"
        }`}
        style={inWatchlist ? { backgroundColor: "var(--primary-soft)" } : undefined}
      >
        <Star size={14} fill={inWatchlist ? "var(--primary)" : "none"} className="text-[var(--primary)]" />
        {inWatchlist ? "En Watchlist" : "Watchlist"}
      </button>
    </div>
  );
}
