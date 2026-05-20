import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, RefreshCw, MoreHorizontal } from "lucide-react";
import { portfolio, portfolioValueHistory, sectorDistribution } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import { PnlBadge } from "../../components/ui/PnlBadge";
import { TabGroup } from "../../components/ui/TabGroup";
import { PortfolioRow } from "../../components/dashboard/PortfolioRow";

const RANGE_TABS = [
  { key: "1S",   label: "1S"   },
  { key: "1M",   label: "1M"   },
  { key: "3M",   label: "3M"   },
  { key: "6M",   label: "6M"   },
  { key: "1A",   label: "1A"   },
  { key: "Todo", label: "Todo" },
] as const;

const ASSET_TABS = [
  { key: "todo",     label: "Todo"     },
  { key: "acciones", label: "Acciones" },
  { key: "cripto",   label: "Cripto"   },
] as const;

type RangeKey = (typeof RANGE_TABS)[number]["key"];
type AssetTab = (typeof ASSET_TABS)[number]["key"];

const PIE_COLORS = ["var(--primary)", "#F08A3C", "#F472B6", "#A855F7"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { lastPriceUpdate } = useApp();
  const [range, setRange] = useState<RangeKey>("1M");
  const [tab, setTab] = useState<AssetTab>("todo");

  const totalValue = portfolio.reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const totalCost  = portfolio.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalPnl   = totalValue - totalCost;
  const pnlPercent = (totalPnl / totalCost) * 100;

  const filteredPortfolio = portfolio.filter((p) => {
    if (tab === "acciones") return p.type === "accion";
    if (tab === "cripto")   return p.type === "cripto";
    return true;
  });

  return (
    <div
      data-testid="dashboard"
      className="p-8 text-[var(--text)] relative"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/3 w-[420px] h-[420px] rounded-full opacity-60"
        style={{ background: "var(--glow-orange)", filter: "blur(60px)" }}
      />

      {/* ── Header ── */}
      <div className="mb-6 flex items-end justify-between relative">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Panel de mi portfolio
          </p>
          <div className="flex items-end gap-3">
            <h1
              data-testid="dashboard-total-value"
              className="font-mono leading-none"
              style={{ fontSize: 38, fontWeight: 700 }}
            >
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h1>
            <PnlBadge
              value={totalPnl}
              format="currency"
              className="mb-1"
              data-testid="dashboard-pnl"
            />
            <PnlBadge
              value={pnlPercent}
              format="percent"
              className="mb-1"
              data-testid="dashboard-pnl-percent"
            />
          </div>
        </div>

        <div
          data-testid="dashboard-last-update"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
        >
          <RefreshCw size={12} className="text-emerald-400" />
          <span className="text-[11px] text-[var(--text-muted)]">Última actualización:</span>
          <span className="text-[11px] font-mono text-[var(--text)]">{lastPriceUpdate}</span>
        </div>
      </div>

      {/* ── Hero charts ── */}
      <div className="grid grid-cols-3 gap-5 mb-6 relative">

        {/* Historia */}
        <div
          data-testid="dashboard-history-chart"
          className="col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[var(--text)]" style={{ fontSize: 16 }}>Historia</h3>
              <p className="text-xs text-[var(--text-muted)]">Evolución del valor del portfolio</p>
            </div>
            <TabGroup
              tabs={RANGE_TABS as unknown as { key: RangeKey; label: string }[]}
              active={range}
              onChange={(k) => setRange(k as RangeKey)}
              variant="pill"
              data-testid="dashboard-range-tabs"
            />
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioValueHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10B981" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}    />
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
        <div
          data-testid="dashboard-allocation-chart"
          className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]"
        >
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
                      <Cell key={`${s.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
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

      {/* ── Tabla de activos ── */}
      <div
        data-testid="portfolio-table-container"
        className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <TabGroup
            tabs={ASSET_TABS as unknown as { key: AssetTab; label: string }[]}
            active={tab}
            onChange={(k) => setTab(k as AssetTab)}
            variant="surface"
            data-testid="dashboard-asset-tabs"
          />
          <button
            data-testid="dashboard-add-transaction"
            onClick={() => navigate("/app/search")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-semibold"
            style={{ background: "var(--gradient-brand)", boxShadow: "0 4px 14px rgba(255,107,53,0.25)" }}
          >
            <Plus size={14} /> Agregar Transacción
          </button>
        </div>

        <div className="overflow-x-auto">
          <table data-testid="portfolio-table" className="w-full text-sm">
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
              {filteredPortfolio.map((p, i) => (
                <PortfolioRow key={p.ticker} item={p} isFirst={i === 0} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
