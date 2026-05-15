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
  Trash2,
  UserRound,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLogout, useUser } from "../../hooks/auth/useAuth";
import { handleError } from "../../hooks/auth/utils/handlerError";
import { useDeleteAccount } from "../../hooks/user/useDeleteAccount";

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
  const deleteAccount = useDeleteAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [showDeletePassword, setShowDeletePassword] = useState(false);

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

  const openDeleteDialog = () => {
    setAccountMenuOpen(false);
    setDeleteError(undefined);
    setDeletePassword("");
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteAccount.isPending) return;
    setDeleteDialogOpen(false);
    setDeletePassword("");
    setDeleteError(undefined);
    setShowDeletePassword(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(undefined);

    if (!deletePassword) {
      setDeleteError("Ingresá tu contraseña actual");
      return;
    }

    try {
      await deleteAccount.mutateAsync({ password: deletePassword });
      navigate("/login", { replace: true });
    } catch (error) {
      setDeleteError(handleError(error) || "No pudimos eliminar la cuenta");
    }
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "var(--gradient-brand)" }}
              >
                {avatar}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p className="text-[var(--text)] text-[13px] font-semibold">
                  {user?.name ?? "Usuario"}
                </p>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {user?.email ?? ""}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-[var(--text-faint)] transition-transform ${
                  accountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {accountMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-30 w-64 overflow-hidden rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl shadow-black/20"
              >
                <div className="px-3 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <UserRound size={15} className="text-[var(--primary)]" />
                    <span className="text-[12px] font-semibold text-[var(--text)]">
                      Cuenta
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--text-muted)] truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openDeleteDialog}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
                >
                  <Trash2 size={15} />
                  Eliminar cuenta
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--bg)]">
          <Outlet />
        </main>
      </div>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/55">
          <form
            onSubmit={handleDeleteAccount}
            className="w-full max-w-[420px] rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-2xl shadow-black/30"
          >
            <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)]">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--danger-soft)" }}
              >
                <ShieldAlert size={18} className="text-[var(--danger)]" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--text)]">
                  Eliminar cuenta
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">
                  Confirmá tu contraseña actual para eliminar tu cuenta.
                </p>
              </div>
            </div>

            <div className="px-5 py-4">
              {deleteError && (
                <div
                  role="alert"
                  className="mb-3 px-3 py-2 rounded-lg text-[13px] border"
                  style={{
                    background: "var(--danger-soft)",
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                >
                  {deleteError}
                </div>
              )}

              <label
                htmlFor="delete-account-password"
                className="block text-[13px] font-semibold text-[var(--text)] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="delete-account-password"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    if (deleteError) setDeleteError(undefined);
                  }}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg outline-none text-[13px] text-[var(--text)] bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--danger)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((show) => !show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={
                    showDeletePassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showDeletePassword ? (
                    <EyeOff size={16} className="text-[var(--text-faint)]" />
                  ) : (
                    <Eye size={16} className="text-[var(--text-faint)]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleteAccount.isPending}
                className="px-3 py-2 rounded-lg text-[13px] font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deleteAccount.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "var(--danger)" }}
              >
                <Trash2 size={15} />
                {deleteAccount.isPending ? "Eliminando…" : "Eliminar cuenta"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
