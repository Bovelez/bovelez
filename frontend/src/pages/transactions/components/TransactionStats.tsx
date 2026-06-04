type Props = {
  total: number;
  buyCount: number;
  sellCount: number;
  isLoading: boolean;
};

type StatCardProps = {
  label: string;
  value: number | string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  dataCy?: string;
};

function StatCard({ label, value, colorClass, borderClass, bgClass, dataCy }: StatCardProps) {
  return (
    <div data-cy={dataCy} className={`rounded-2xl border px-5 py-4 ${borderClass} ${bgClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
        {label}
      </p>
      <p data-cy={dataCy ? `${dataCy}-value` : undefined} className={`mt-1 font-mono text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

export function TransactionStats({ total, buyCount, sellCount, isLoading }: Props) {
  const placeholder = "…";

  return (
    <div data-cy="transaction-stats" className="relative z-10 mb-8 grid grid-cols-3 gap-4">
      <StatCard
        label="Total"
        value={isLoading ? placeholder : total}
        colorClass="text-[var(--text)]"
        borderClass="border-[var(--border)]/60"
        bgClass="bg-[var(--surface)]/60 backdrop-blur-sm"
        dataCy="stat-total"
      />
      <StatCard
        label="Compras"
        value={isLoading ? placeholder : buyCount}
        colorClass="text-emerald-500"
        borderClass="border-emerald-500/20"
        bgClass="bg-emerald-500/5"
        dataCy="stat-buys"
      />
      <StatCard
        label="Ventas"
        value={isLoading ? placeholder : sellCount}
        colorClass="text-rose-500"
        borderClass="border-rose-500/20"
        bgClass="bg-rose-500/5"
        dataCy="stat-sells"
      />
    </div>
  );
}