import { FileText, ExternalLink } from "lucide-react";
import type { EdgarFiling } from "../../types/edgar.types";

type Props = {
  filings: EdgarFiling[];
  isLoading: boolean;
};

export function FilingsTab({ filings, isLoading }: Props) {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
      <div className="px-5 py-3 flex items-center gap-2 border-b border-[var(--border)]">
        <FileText size={14} className="text-[var(--primary)]" />
        <p className="text-xs text-[var(--text-muted)]">
          Reportes obtenidos desde{" "}
          <span className="text-[var(--primary)] font-semibold">data.sec.gov/submissions</span>
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[var(--text-muted)]">Cargando filings...</div>
      ) : filings.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)]">
          No hay filings disponibles.
        </div>
      ) : (
        filings.map((f, i) => (
          <div
            key={f.accessionNumber}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="px-2 py-1 rounded font-bold font-mono text-[11px] text-[var(--primary)]"
                style={{ backgroundColor: "var(--primary-soft)" }}
              >
                {f.form}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--text)]">
                  {f.description || f.form}
                </p>
                <p className="text-[11px] text-[var(--text-faint)]">Filed: {f.filingDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--text-faint)]">{f.accessionNumber}</span>
              <a
                href={f.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-[var(--primary)] hover:opacity-75 transition-opacity"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
