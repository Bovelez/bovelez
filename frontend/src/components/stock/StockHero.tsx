import type { EdgarCompanyRecord } from "../../types/edgar.types";
import type { StockPrice } from "../../types/prices.types";

type Props = {
  company: EdgarCompanyRecord;
  price: StockPrice | undefined;
};

export function StockHero({ company, price }: Props) {
  return (
    <div className="px-8 py-8 relative overflow-hidden bg-[var(--surface)] border-b border-[var(--border)]">
      <div
        className="pointer-events-none absolute -top-24 right-1/4 w-[460px] h-[460px] rounded-full opacity-60"
        style={{ background: "var(--glow-orange)", filter: "blur(70px)" }}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-3 py-1 rounded-lg text-sm font-bold font-mono text-[var(--primary)]"
              style={{ backgroundColor: "var(--primary-soft)" }}
            >
              {company.ticker}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-2)] text-[var(--text-muted)]">
              S&P 500
            </span>
          </div>
          <h1 className="mb-1 text-[var(--text)]" style={{ fontSize: 28 }}>
            {company.name}
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{company.ticker}</span>
            <span className="text-[11px] text-[var(--text-faint)]">· CIK {company.cik}</span>
          </div>
        </div>

        <div className="text-right">
          {price ? (
            <>
              <p className="font-mono font-bold text-[var(--text)]" style={{ fontSize: 36 }}>
                ${price.price.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--text-faint)] mt-1">
                Actualizado: {new Date(price.updatedAt).toLocaleString("es-AR")}
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Sin precio disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}
