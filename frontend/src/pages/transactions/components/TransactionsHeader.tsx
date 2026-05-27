import { ReceiptText } from "lucide-react";

export function TransactionsHeader() {
  return (
    <header className="relative z-10 mb-10">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)]/50 bg-[var(--surface-2)]/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <ReceiptText size={12} className="text-violet-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Historial Auditado
        </span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)] drop-shadow-sm md:text-5xl lg:text-6xl">
        Operaciones
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
        Registro completo e inmutable de todas tus compras y ventas. Filtrá por
        ticker, tipo de operación o rango de fechas para auditar tus decisiones
        de inversión.
      </p>
    </header>
  );
}