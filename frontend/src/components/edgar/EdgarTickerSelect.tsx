import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Search, X } from "lucide-react";
import { useEdgarTickerAutocomplete } from "../../hooks/edgar/autocomplete/useEdgarTickerAutocomplete";
import type { PricedEdgarCompany } from "../../types/prices.types";

type EdgarTickerSelectProps = {
  companies: PricedEdgarCompany[];
  selectedCompany: PricedEdgarCompany | null;
  isLoading: boolean;
  errorMessage?: string;
  onSelectCompany: (company: PricedEdgarCompany) => void;
  onClearSelection?: () => void;
};

function money(value: number | null): string {
  if (value === null) return "Sin precio";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function EdgarTickerSelect({
  companies,
  selectedCompany,
  isLoading,
  errorMessage,
  onSelectCompany,
  onClearSelection,
}: EdgarTickerSelectProps) {
  const [query, setQuery] = useState("");
  const autocomplete = useEdgarTickerAutocomplete(
    companies,
    query,
    selectedCompany?.ticker,
  );

  useEffect(() => {
    if (selectedCompany) setQuery(selectedCompany.ticker);
  }, [selectedCompany]);

  const handleClearSelection = () => {
    setQuery("");
    onClearSelection?.();
  };

  return (
    <section
      data-testid="edgar-ticker-select"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-[17px] text-[var(--text)]">Seleccionar acción</h2>
          <p className="text-[12px] text-[var(--text-muted)]">
            Tickers S&amp;P disponibles desde EDGAR
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--primary)]">
          <Building2 size={17} />
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
          />
          <input
            data-testid="edgar-ticker-search"
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            placeholder="Buscar ticker o empresa..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] py-2.5 pl-9 pr-10 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
          />
          {selectedCompany && (
            <button
              type="button"
              data-testid="edgar-ticker-clear"
              onClick={handleClearSelection}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              aria-label="Limpiar selección"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mt-3 max-h-[280px] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-deep)]">
          {isLoading && (
            <div className="px-3 py-4 text-[12px] text-[var(--text-muted)]">
              Cargando empresas...
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="px-3 py-4 text-[12px] text-rose-300">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && autocomplete.suggestions.length === 0 && (
            <div className="px-3 py-4 text-[12px] text-[var(--text-muted)]">
              No encontramos ese ticker en el universo S&amp;P.
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            autocomplete.suggestions.map((company) => {
              const isSelected = company.ticker === selectedCompany?.ticker;

              return (
                <button
                  key={company.ticker}
                  type="button"
                  data-testid={`edgar-company-${company.ticker}`}
                  onClick={() => onSelectCompany(company)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--surface-2)]"
                      : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[13px] font-bold text-[var(--text)]">
                      {company.ticker}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--text-muted)]">
                      {company.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-right">
                      <span className="block text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
                        Precio
                      </span>
                      <span className="block font-mono text-[12px] font-semibold text-[var(--text)]">
                        {money(company.price)}
                      </span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    )}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </section>
  );
}
