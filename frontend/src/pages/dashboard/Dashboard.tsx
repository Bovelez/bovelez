import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, ChevronRight, RefreshCw, MoreHorizontal } from "lucide-react";
import {
  portfolio, portfolioValueHistory, sectorDistribution,
} from "../../data/mockData";
import { useApp } from "../../context/AppContext";

const SECTOR_STYLES: Record<string, string> = {
  Tech:       "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  Crypto:     "bg-orange-500/15 text-orange-300 border border-orange-500/30",
  Auto:       "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Finance:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Healthcare: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  Energy:     "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  Consumer:   "bg-pink-500/15 text-pink-300 border border-pink-500/30",
};

const RANGES = ["1S", "1M", "3M", "6M", "1A", "Todo"] as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { lastPriceUpdate } = useApp();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M");
  const [tab, setTab] = useState<"todo" | "acciones" | "cripto">("todo");

  const totalValue = portfolio.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const totalCost = portfolio.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalPnl = totalValue - totalCost;
  const pnlPercent = (totalPnl / totalCost) * 100;
  const pos = totalPnl >= 0;

  const filteredPortfolio = portfolio.filter(p => {
    if (tab === "acciones") return p.type === "accion";
    if (tab === "cripto") return p.type === "cripto";
    return true;
  });

  const pieColors = ["var(--primary)", "#F08A3C", "#F472B6", "#A855F7"];

  return (
    <div className="p-8 text-[var(--text)] relative" style={{ fontFamily: "var(--font-body)" }}>
      {/* Subtle ambient orange glow behind hero cards */}
      <div
        className="pointer-events-none absolute -top-24 left-1/3 w-[420px] h-[420px] rounded-full opacity-60"
        style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
      />

      {/* Header */}
      <div className="mb-6 flex items-end justify-between relative">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Panel de mi portfolio
          </p>
          <div className="flex items-end gap-3">
            <h1 className="font-mono leading-none" style={{ fontSize: 38, fontWeight: 700 }}>
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold mb-1 ${
                pos ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {pos ? "+" : ""}{totalPnl.toFixed(2)} ({pos ? "+" : ""}{pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <RefreshCw size={12} className="text-emerald-400" />
          <span className="text-[11px] text-[var(--text-muted)]">Última actualización:</span>
          <span className="text-[11px] font-mono text-[var(--text)]">{lastPriceUpdate}</span>
        </div>
      </div>

      {/* Hero charts: Historia + Asignación */}
      <div className="grid grid-cols-3 gap-5 mb-6 relative">
        {/* Historia */}
        <div className="col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[var(--text)]" style={{ fontSize: 16 }}>Historia</h3>
              <p className="text-xs text-[var(--text-muted)]">Evolución del valor del portfolio</p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)]">
              {RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    range === r
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioValueHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-faint)" fontSize={10} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Valor"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#histGrad)"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asignación */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[var(--text)]" style={{ fontSize: 16 }}>Asignación</h3>
            <button className="text-[var(--text-faint)] hover:text-[var(--text)]">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorDistribution}
                    innerRadius={48}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorDistribution.map((s, i) => (
                      <Cell key={`${s.name}-${i}`} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {sectorDistribution.map((s, i) => (
                <div key={`${s.name}-${i}`} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: pieColors[i % pieColors.length] }}
                    />
                    <span className="text-[var(--text-muted)] truncate">{s.name}</span>
                  </div>
                  <span className="font-mono text-[var(--text)] font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activos */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)]">
            {[
              { k: "todo", l: "Todo" },
              { k: "acciones", l: "Acciones" },
              { k: "cripto", l: "Cripto" },
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as typeof tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === t.k
                    ? "bg-[var(--surface-2)] text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate("/app/search")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold"
            style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
          >
            <Plus size={14} /> Agregar Transacción
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--text-faint)] text-[10px] uppercase tracking-widest">
                <th className="text-left px-5 py-3 font-semibold">Nombre</th>
                <th className="text-right px-3 py-3 font-semibold">Precio</th>
                <th className="text-right px-3 py-3 font-semibold">24h %</th>
                <th className="text-right px-3 py-3 font-semibold">Cantidad</th>
                <th className="text-right px-3 py-3 font-semibold">Monto invertido</th>
                <th className="text-right px-3 py-3 font-semibold">PPC</th>
                <th className="text-right px-3 py-3 font-semibold">+/−</th>
                <th className="text-right px-3 py-3 font-semibold">% G/P</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredPortfolio.map((p, i) => {
                const pnl = (p.currentPrice - p.avgPrice) * p.quantity;
                const pct = ((p.currentPrice - p.avgPrice) / p.avgPrice) * 100;
                const isPos = pnl >= 0;
                const sectorClass =
                  SECTOR_STYLES[p.sector] ||
                  "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]";
                return (
                  <tr
                    key={p.ticker}
                    onClick={() => navigate(`/app/stock/${p.ticker}`)}
                    className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[11px] font-bold text-[var(--primary)]">
                          {p.ticker.slice(0, 2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[var(--text)] text-[13px] font-semibold leading-tight">
                            {p.name}{" "}
                            <span className="font-mono text-[var(--text-muted)] font-bold">
                              {p.ticker}
                            </span>
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sectorClass}`}>
                            {p.sector}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-3 font-mono text-[var(--text)]">
                      ${p.currentPrice.toFixed(2)}
                    </td>
                    <td className={`text-right px-3 font-mono font-semibold ${p.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}%
                    </td>
                    <td className="text-right px-3 font-mono text-[var(--text)]">{p.quantity}</td>
                    <td className="text-right px-3 font-mono text-[var(--text)] font-semibold">
                      ${(p.quantity * p.avgPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right px-3 font-mono text-[var(--text-muted)]">
                      ${p.avgPrice.toFixed(2)}
                    </td>
                    <td className={`text-right px-3 font-mono font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPos ? "+" : ""}${pnl.toFixed(2)}
                    </td>
                    <td className={`text-right px-3 font-mono font-semibold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                      {isPos ? "+" : ""}{pct.toFixed(2)}%
                    </td>
                    <td className="px-5 text-right">
                      <ChevronRight size={14} className="text-[var(--text-faint)] inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
