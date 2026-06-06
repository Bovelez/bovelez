import type { ReactNode } from 'react';
import { BrandText } from '../ui/BrandText';
import { TrendingUp } from 'lucide-react';

interface AuthPageShellProps {
  children: ReactNode;
}

/**
 * Mobile auth shell — single column, full-screen.
 * Brand logo + icon at the top, form below.
 * No left panel (desktop-only concept).
 */
export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      className="min-h-screen bg-[var(--bg-deep)] flex flex-col"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Glow background */}
      <div
        className="fixed pointer-events-none rounded-full top-[-80px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] opacity-50"
        style={{ background: 'var(--glow-orange)', filter: 'blur(70px)' }}
      />

      {/* Brand header */}
      <div className="relative flex flex-col items-center pt-14 pb-8 px-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border border-[var(--border-strong)]"
          style={{ background: 'var(--gradient-brand-soft)' }}
        >
          <TrendingUp size={24} className="text-[var(--primary)]" />
        </div>
        <BrandText fontSize={36}>VIPJM</BrandText>
      </div>

      {/* Form card */}
      <div className="relative flex-1 flex flex-col px-6 pb-10">{children}</div>
    </div>
  );
}
