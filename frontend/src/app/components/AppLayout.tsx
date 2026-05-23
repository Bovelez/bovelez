import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Search as SearchIcon,
  Star,
  Briefcase,
  LogOut,
  Trash2,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { useUser, useLogout } from "../../hooks/auth/useAuth";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useStockPrices } from "../../hooks/prices/useStockPrices";
import { useUpdateStockPrices } from "../../hooks/prices/useUpdateStockPrices";
import { useDeleteAccount } from "../../hooks/user/useDeleteAccount";
import { handleError } from "../../hooks/auth/utils/handlerError";
import { BrandText } from "../../components/ui/BrandText";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   path: "/app/dashboard"    },
  { icon: Briefcase,       label: "Portfolio",   path: "/app/portfolio"    },
  { icon: Receipt,         label: "Operaciones", path: "/app/transactions" },
  { icon: Star,            label: "Watchlist",   path: "/app/watchlist"    },
  { icon: SearchIcon,      label: "Búsqueda",    path: "/app/search"       },
];

export function AppLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { data: user } = useUser();
  const logout    = useLogout();
  const deleteAccount = useDeleteAccount();
  const pricesQuery = useStockPrices();
  const lastPriceRunQuery = useLastPriceRun();
  const updateStockPrices = useUpdateStockPrices();

  const [searchQuery,  setSearchQuery]  = useState("");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const closeDeleteModal = () => {
    if (deleteAccount.isPending) return;
    setDeleteModalOpen(false);
    setDeletePassword("");
    setDeleteError(undefined);
  };

  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setDeleteError("Ingresá tu contraseña para confirmar");
      return;
    }

    setDeleteError(undefined);
    try {
      await deleteAccount.mutateAsync({ password: deletePassword });
      navigate("/login", { replace: true });
    } catch (error) {
      setDeleteError(handleError(error) ?? "No se pudo borrar la cuenta");
    }
  };

  const priceTickers = (pricesQuery.data ?? []).map((price) => price.ticker);
  const lastPriceUpdate = lastPriceRunQuery.data?.finishedAt
    ? new Date(lastPriceRunQuery.data.finishedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const canUpdatePrices =
    priceTickers.length > 0 &&
    !pricesQuery.isLoading &&
    !updateStockPrices.isPending;

  const handleUpdatePrices = () => {
    if (!canUpdatePrices) return;
    updateStockPrices.mutate({ tickers: priceTickers });
  };

  const avatar =
    (user?.name
      ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
      : "U");

  return (
    <div
      data-testid="app-layout"
      className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Sidebar ── */}
      <aside
        data-testid="sidebar"
        className="flex flex-col transition-all duration-200 shrink-0 h-screen bg-[var(--sidebar)] border-r border-[var(--border)]"
        style={{ width: sidebarOpen ? 232 : 64 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border)]">
          {sidebarOpen && (
            <BrandText
              fontSize={22}
              className="cursor-pointer select-none"
              style={{ letterSpacing: "-0.5px" }}
              onClick={() => navigate("/app/dashboard")}
            >
              VIPJM
            </BrandText>
          )}
          <button
            data-testid="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-[var(--text-muted)] hover:opacity-80"
            aria-label={sidebarOpen ? "Colapsar sidebar" : "Expandir sidebar"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav data-testid="sidebar-nav" className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const active =
              location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                data-testid={`nav-${label.toLowerCase()}`}
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

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            data-testid="sidebar-logout"
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

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header
          data-testid="app-header"
          className="flex items-center gap-4 px-6 shrink-0 h-[60px] bg-[var(--bg-deep)] border-b border-[var(--border)]"
        >
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md" role="search">
            <div className="relative">
              <SearchIcon
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                data-testid="header-search"
                type="text"
                placeholder="Buscar ticker o empresa…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg outline-none text-[13px] text-[var(--text)] bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] transition-all"
              />
            </div>
          </form>

          <div className="flex-1" />

          {/* Last price update */}
          <button
            type="button"
            data-testid="header-price-update"
            onClick={handleUpdatePrices}
            disabled={!canUpdatePrices}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
            title={
              priceTickers.length === 0
                ? "No hay tickers cargados para actualizar"
                : "Actualizar precios desde Yahoo Finance"
            }
          >
            <RefreshCw
              size={13}
              className={`text-emerald-400 ${
                updateStockPrices.isPending ? "animate-spin" : ""
              }`}
            />
            <span className="text-[11px] text-[var(--text-muted)]">Precios:</span>
            <span className="font-mono text-[11px] text-[var(--text)]">
              {updateStockPrices.isPending ? "..." : lastPriceUpdate}
            </span>
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <div
              data-testid="user-menu-trigger"
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--gradient-brand)" }}
              >
                {avatar}
              </div>
              <div className="hidden md:block leading-tight">
                <p data-testid="user-name" className="text-[var(--text)] text-[13px] font-semibold">
                  {user?.name ?? "Usuario"}
                </p>
                <span data-testid="user-email" className="text-[11px] text-[var(--text-muted)]">
                  {user?.email ?? ""}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--text-faint)] transition-transform duration-150 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {userMenuOpen && (
              <div
                data-testid="user-menu"
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden"
              >
                <button
                  data-testid="user-menu-delete-account"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setDeleteModalOpen(true);
                  }}
                  disabled={deleteAccount.isPending}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-rose-400 hover:bg-[var(--surface-2)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                  Borrar cuenta
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--bg)]">
          <Outlet />
        </main>
      </div>

      {deleteModalOpen && (
        <div
          data-testid="delete-account-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h2 id="delete-account-title" className="text-[15px] font-semibold text-[var(--text)]">
                    Borrar cuenta
                  </h2>
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount} className="px-5 py-4">
              <label
                htmlFor="delete-account-password"
                className="mb-1.5 block text-[13px] font-semibold text-[var(--text)]"
              >
                Confirmá tu contraseña
              </label>
              <input
                id="delete-account-password"
                data-testid="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (deleteError) setDeleteError(undefined);
                }}
                autoComplete="current-password"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]"
                autoFocus
              />

              {deleteError && (
                <p
                  data-testid="delete-account-error"
                  className="mt-2 text-[12px] text-rose-400"
                  role="alert"
                >
                  {deleteError}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteAccount.isPending}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-[13px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteAccount.isPending}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteAccount.isPending ? "Borrando…" : "Borrar cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
