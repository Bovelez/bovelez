import type { Transaction } from '../../types/transactions.types';

export type TypeFilter = 'all' | 'BUY' | 'SELL';

export function formatMoney(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function byDateDesc(a: Transaction, b: Transaction): number {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) return dateDiff;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
