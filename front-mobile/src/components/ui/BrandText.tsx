import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

interface BrandTextProps {
  children: ReactNode;
  fontSize?: number | string;
  className?: string;
  style?: CSSProperties;
  italic?: boolean;
  onClick?: MouseEventHandler<HTMLSpanElement>;
}

export function BrandText({
  children,
  fontSize,
  className = '',
  style = {},
  italic = true,
  onClick,
}: BrandTextProps) {
  return (
    <span
      onClick={onClick}
      className={`bg-clip-text text-transparent ${italic ? 'italic' : ''} ${className}`}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize,
        backgroundImage: 'var(--gradient-brand)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
