import { BookMarked } from "lucide-react";

interface WatchlistHeaderProps {
    count: number;
}

export function WatchlistHeader({ count }: WatchlistHeaderProps) {
    return (
        <header data-testid="watchlist-header" className="relative z-10 mb-8">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)]/50 bg-[var(--surface-2)]/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
    <BookMarked size={12} className="text-orange-400" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        Watchlist Personal
    </span>
    </div>
    <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)] drop-shadow-sm md:text-5xl">
        Mi Watchlist
    </h1>
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
        Seguí el precio y las métricas financieras de tus empresas de interés.{" "}
    <span className="font-semibold text-[var(--text)]">
        {count} empresa{count !== 1 ? "s" : ""}
    </span>{" "}
    en seguimiento.
    </p>
    </header>
);
}