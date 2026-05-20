import type { ReactNode } from "react";

interface AuthPageShellProps {
  leftContent: ReactNode;
  children: ReactNode;
}


export function AuthPageShell({ leftContent, children }: AuthPageShellProps) {
  return (
    <div
      className="flex h-screen bg-[var(--bg-deep)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Left branding panel — hidden on small screens */}
      <div
        data-testid="brand-panel"
        className="hidden lg:flex flex-col items-center justify-center w-5/12 p-12 relative overflow-hidden bg-[var(--bg)]"
      >
        <div
          className="absolute pointer-events-none rounded-full top-[15%] left-[15%] w-[320px] h-[320px] opacity-70"
          style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
        />
        <div className="relative text-center w-full">{leftContent}</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-deep)]">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
