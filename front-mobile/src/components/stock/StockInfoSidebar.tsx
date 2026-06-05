import { Calendar } from "lucide-react";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import type { EdgarCompanyRecord } from "../../types/edgar.types";
import type { StockPrice } from "../../types/prices.types";

type Props = {
  company: EdgarCompanyRecord;
  price: StockPrice | undefined;
};

export function StockInfoSidebar({ company, price }: Props) {
  const lastPriceRunQuery = useLastPriceRun();
  const lastUpdate =
    lastPriceRunQuery.data?.finishedAt ?? price?.updatedAt ?? null;
  return (
    <div className="w-56 shrink-0 space-y-4">
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[var(--text-faint)]">
          Precio
        </p>
        {price ? (
          <>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--text-muted)]">Último precio</span>
              <span className="text-xs font-bold font-mono text-[var(--text)]">
                ${price.price.toFixed(2)}
              </span>
            </div>
            {lastUpdate && (
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-[var(--text-muted)]">Actualizado</span>
                <span className="text-xs font-bold font-mono text-[var(--text)]">
                  {new Date(lastUpdate).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Sin datos de precio</p>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={13} className="text-[var(--primary)]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">
            Empresa
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{company.name}</p>
        <p className="text-xs font-mono text-[var(--text-faint)] mt-1">{company.ticker}</p>
      </div>
    </div>
  );
}
