import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Search as SearchIcon,
  Star,
  Briefcase,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { useUser, useLogout } from "../../hooks/auth/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app/dashboard" },
  { icon: Briefcase, label: "Portfolio", path: "/app/portfolio" },
  { icon: Receipt, label: "Operaciones", path: "/app/transactions" },
  { icon: Star, label: "Watchlist", path: "/app/watchlist" },
  { icon: SearchIcon, label: "Búsqueda", path: "/app/search" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useUser();
  const logout = useLogout();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lastPriceUpdate = "—";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const avatar =
    user?.avatar ||
    (user?.name
      ? user.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "U");

  return (
    <div
      className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <aside
        className="flex flex-col transition-all duration-200 shrink-0 h-screen bg-[var(--sidebar)] border-r border-[var(--border)]"
        style={{ width: sidebarOpen ? 232 : 64 }}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border)]">
          {sidebarOpen && (
            <span
              className="cursor-pointer select-none italic bg-clip-text text-transparent"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                backgroundImage: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
              onClick={() => navigate("/app/dashboard")}
            >
              VIPJM
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-[var(--text-muted)] hover:opacity-80"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active =
              location.pathname === path ||
              location.pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  active
                    ? "text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                }`}
                style={active ? { background: "var(--gradient-brand)" } : undefined}
              >
                <Icon size={18} />
                {sidebarOpen && (
                  <span className="text-[13px] font-semibold">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-4 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-[var(--text-faint)] hover:bg-[var(--surface-2)]"
          >
            <LogOut size={18} />
            {sidebarOpen && (
              <span className="text-[13px] font-semibold">Cerrar sesión</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 shrink-0 h-[60px] bg-[var(--bg-deep)] border-b border-[var(--border)]">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                type="text"
                placeholder="Buscar ticker o empresa…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg outline-none text-[13px] text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] transition-all"
              />
            </div>
          </form>

          <div className="flex-1" />

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
            title="Última actualización del proceso batch (Yahoo Finance)"
          >
            <RefreshCw size={13} className="text-emerald-400" />
            <span className="text-[11px] text-[var(--text-muted)]">
              Precios:
            </span>
            <span className="text-[11px] text-[var(--text)] font-mono">
              {lastPriceUpdate}
            </span>
          </div>

          <div className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--gradient-brand)" }}
            >
              {avatar}
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-[var(--text)] text-[13px] font-semibold">
                {user?.name ?? "Usuario"}
              </p>
              <span className="text-[11px] text-[var(--text-muted)]">
                {user?.email ?? ""}
              </span>
            </div>
            <ChevronDown size={14} className="text-[var(--text-faint)]" />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--bg)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
