import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, X, Building2 } from "lucide-react";
import { useEdgarCompanies } from "../../hooks/edgar/useEdgarCompanies";

export function GlobalSearchBar() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: companies } = useEdgarCompanies();

    const results = query.trim().length > 0
        ? (companies ?? []).filter((c) => {
            const q = query.trim().toUpperCase();
            return c.ticker.startsWith(q) || c.name.toUpperCase().includes(q);
          }).slice(0, 8)
        : [];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleSelect = (ticker: string) => {
        setQuery("");
        setOpen(false);
        navigate(`/app/stock/${ticker}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
        }
        if (e.key === "Enter" && query.trim()) {
            setOpen(false);
            navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
            setQuery("");
        }
    };

    const showDropdown = open && query.trim().length > 1;

    return (
        <div ref={containerRef} className="relative flex-1 max-w-md">
            <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none"
            />
            <input
                ref={inputRef}
                data-testid="header-search"
                type="text"
                placeholder="Buscar ticker o empresa…"
                value={query}
                autoComplete="off"
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => query.length > 1 && setOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-8 py-2 rounded-lg outline-none text-[13px] text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] transition-all"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text)] transition-colors"
                    aria-label="Limpiar búsqueda"
                >
                    <X size={13} />
                </button>
            )}

            {showDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden z-50">
                    {results.length === 0 && (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--text-muted)]">
                            Sin resultados
                        </div>
                    )}

                    {results.length > 0 && (
                        <>
                            {results.map((company) => (
                                <button
                                    key={company.cik}
                                    type="button"
                                    onClick={() => handleSelect(company.ticker)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)] transition-colors border-t border-[var(--border)] first:border-t-0"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-deep)] font-mono text-[11px] font-black text-[var(--primary)]">
                                        <Building2 size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-mono text-[13px] font-black text-[var(--text)]">
                                            {company.ticker}
                                        </span>
                                        <p className="text-[11px] text-[var(--text-muted)] truncate">{company.name}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
