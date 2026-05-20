import { useNavigate } from "react-router";
import { TrendingUp } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-[var(--bg-deep)] text-[var(--text)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 sticky top-0 z-50 h-16 bg-[var(--bg-deep)] border-b border-[var(--border)]">
        <span
          className="italic bg-clip-text text-transparent"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 26,
            backgroundImage: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          VIPJM
        </span>
        <div className="hidden md:flex items-center gap-8 text-[13px] text-[var(--text-muted)]">
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-[var(--text)]"
          >
            Ingresar
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--gradient-brand)" }}
          >
            Registrarme
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-8 py-32 overflow-hidden"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Orange ambient glow */}
        <div
          className="absolute pointer-events-none rounded-full top-[15%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] opacity-70"
          style={{ background: "var(--glow-orange)", filter: "blur(70px)" }}
        />
        {/* Smaller secondary halo */}
        <div
          className="absolute pointer-events-none rounded-full bottom-[10%] right-[15%] w-[260px] h-[260px] opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-[var(--border-strong)]"
            style={{ background: "var(--gradient-brand-soft)" }}
          >
            <TrendingUp size={14} className="text-[var(--primary)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text)]">
              Datos SEC EDGAR + Yahoo Finance
            </span>
          </div>

          <h1
            className="italic mx-auto mb-6 max-w-[980px]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(40px, 6vw, 76px)",
              lineHeight: 1.05,
            }}
          >
            <span className="text-[var(--text)]">Invertí en tu futuro y </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              analizá como los mejores
            </span>
            <span className="text-[var(--text)]"> en un solo lugar.</span>
          </h1>

          <p className="mx-auto mb-9 max-w-[640px] text-[18px] text-[var(--text-muted)] leading-relaxed">
            Tu portfolio tracker con datos reales de la SEC. Seguimiento de posiciones,
            historial de operaciones y comparación de fundamentals — todo en una plataforma.
          </p>

          <div className="flex justify-center gap-12 mt-10">
            {[
              { value: "EDGAR", label: "SEC Full-Text Search" },
              { value: "yfinance", label: "Precios de cierre batch" },
              { value: "Real-time", label: "P&L sobre último cierre" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p
                  className="italic bg-clip-text text-transparent"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 22,
                    backgroundImage: "var(--gradient-brand)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p className="text-[11px] text-[var(--text-faint)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
