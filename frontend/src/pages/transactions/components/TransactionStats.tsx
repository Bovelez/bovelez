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
};

function StatCard({ label, value, colorClass, borderClass, bgClass }: StatCardProps) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${borderClass} ${bgClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

export function TransactionStats({ total, buyCount, sellCount, isLoading }: Props) {
  const placeholder = "…";

  return (
    <div className="relative z-10 mb-8 grid grid-cols-3 gap-4">
      <StatCard
        label="Total"
        value={isLoading ? placeholder : total}
        colorClass="text-[var(--text)]"
        borderClass="border-[var(--border)]/60"
        bgClass="bg-[var(--surface)]/60 backdrop-blur-sm"
      />
      <StatCard
        label="Compras"
        value={isLoading ? placeholder : buyCount}
        colorClass="text-emerald-500"
        borderClass="border-emerald-500/20"
        bgClass="bg-emerald-500/5"
      />
      <StatCard
        label="Ventas"
        value={isLoading ? placeholder : sellCount}
        colorClass="text-rose-500"
        borderClass="border-rose-500/20"
        bgClass="bg-rose-500/5"
      />
    </div>
  );
}