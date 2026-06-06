import { useNavigate } from 'react-router';
import { TrendingUp } from 'lucide-react';
import { BrandText } from '../../components/ui/BrandText';

const STATS = [
  { value: 'EDGAR', label: 'SEC Full-Text Search' },
  { value: 'yfinance', label: 'Precios batch' },
  { value: 'Real-time', label: 'P&L en tiempo real' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      data-testid="landing"
      className="min-h-screen bg-[var(--bg-deep)] text-[var(--text)] flex flex-col"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* ── Navbar ── */}
      <nav
        data-testid="landing-nav"
        className="flex items-center justify-between px-5 sticky top-0 z-50 h-14 bg-[var(--bg-deep)] border-b border-[var(--border)] safe-top"
      >
        <BrandText fontSize={22}>VIPJM</BrandText>

        <button
          data-testid="landing-nav-login"
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text)] cursor-pointer"
        >
          Ingresar
        </button>
      </nav>

      {/* ── Hero ── */}
      <section
        data-testid="landing-hero"
        className="relative flex flex-col items-center text-center px-6 pt-16 pb-10 overflow-hidden flex-1"
      >
        {/* Glow */}
        <div
          className="absolute pointer-events-none rounded-full top-[-40px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] opacity-60"
          style={{ background: 'var(--glow-orange)', filter: 'blur(60px)' }}
        />

        <div className="relative">
          {/* Badge */}
          <div
            data-testid="landing-badge"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 border border-[var(--border-strong)]"
            style={{ background: 'var(--gradient-brand-soft)' }}
          >
            <TrendingUp size={12} className="text-[var(--primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text)]">
              SEC EDGAR + Yahoo Finance
            </span>
          </div>

          {/* Headline */}
          <h1
            data-testid="landing-headline"
            className="italic mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(32px, 9vw, 48px)',
              lineHeight: 1.1,
            }}
          >
            <span className="text-[var(--text)]">Invertí en tu futuro y </span>
            <BrandText italic={false}>analizá como los mejores</BrandText>
            <span className="text-[var(--text)]"> en un solo lugar.</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-[15px] text-[var(--text-muted)] leading-relaxed">
            Portfolio tracker con datos reales de la SEC. Posiciones, historial
            de operaciones y fundamentals — todo en una app.
          </p>

          {/* Stats row */}
          <div
            data-testid="landing-stats"
            className="flex justify-around gap-2 mb-10"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center flex-1">
                <BrandText fontSize={16}>{s.value}</BrandText>
                <p className="text-[10px] text-[var(--text-faint)] mt-0.5 leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            <button
              data-testid="landing-cta-register"
              onClick={() => navigate('/register')}
              className="w-full py-4 rounded-xl text-base font-semibold text-white cursor-pointer"
              style={{
                background: 'var(--gradient-brand)',
                boxShadow: '0 4px 20px rgba(255,107,53,0.30)',
              }}
            >
              Crear cuenta gratis
            </button>
            <button
              data-testid="landing-cta-login"
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-xl text-base font-semibold text-[var(--text)] cursor-pointer border border-[var(--border-strong)] bg-[var(--surface)]"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
