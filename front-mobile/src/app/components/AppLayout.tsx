import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Briefcase,
  Receipt,
  LogOut,
  Trash2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useUser, useLogout } from "../../hooks/auth/useAuth";
import { useLastPriceRun } from "../../hooks/prices/useLastPriceRun";
import { useDeleteAccount } from "../../hooks/user/useDeleteAccount";
import { handleError } from "../../hooks/auth/utils/handlerError";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   path: "/app/dashboard",    testId: "nav-dashboard"    },
  { icon: Briefcase,       label: "Portfolio",   path: "/app/portfolio",    testId: "nav-portfolio"    },
  { icon: Receipt,         label: "Operaciones", path: "/app/transactions", testId: "nav-operaciones"  },
];

export function AppLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { data: user } = useUser();
  const logout    = useLogout();
  const deleteAccount = useDeleteAccount();
  const lastPriceRunQuery = useLastPriceRun();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!deletePassword.trim()) { setDeleteError("Ingresá tu contraseña"); return; }
    setDeleteError(undefined);
    try {
      await deleteAccount.mutateAsync({ password: deletePassword });
      navigate("/login", { replace: true });
    } catch (error) {
      setDeleteError(handleError(error) ?? "No se pudo borrar la cuenta");
    }
  };

  const lastPriceUpdate = lastPriceRunQuery.data?.finishedAt
    ? new Date(lastPriceRunQuery.data.finishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const avatar = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div
      data-testid="app-layout"
      className="flex flex-col h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* ── Top header ── */}
      <header
        data-testid="app-header"
        className="flex items-center justify-between px-4 h-14 shrink-0 bg-[var(--bg-deep)] border-b border-[var(--border)] safe-top"
      >
        {/* Price update */}
        <div
          data-testid="header-price-update"
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1"
        >
          <RefreshCw size={11} className="text-emerald-400" />
          <span className="text-[10px] font-mono text-[var(--text)]">{lastPriceUpdate}</span>
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <div
            data-testid="user-menu-trigger"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--gradient-brand)" }}
            >
              {avatar}
            </div>
            <span data-testid="user-name" className="text-sm font-semibold text-[var(--text)]">
              {user?.name?.split(" ")[0] ?? "Usuario"}
            </span>
            <ChevronDown size={13} className={`text-[var(--text-faint)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </div>

          {userMenuOpen && (
            <div
              data-testid="user-menu"
              className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p data-testid="user-email" className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
              <button
                data-testid="sidebar-logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)]"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
              <button
                data-testid="user-menu-delete-account"
                onClick={() => { setUserMenuOpen(false); setDeleteModalOpen(true); }}
                disabled={deleteAccount.isPending}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-400 border-t border-[var(--border)] disabled:opacity-60"
              >
                <Trash2 size={14} /> Borrar cuenta
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-auto bg-[var(--bg)]">
        <Outlet />
      </main>

      {/* ── Bottom navigation ── */}
      <nav
        data-testid="bottom-nav"
        className="flex items-center justify-around shrink-0 h-16 bg-[var(--bg-deep)] border-t border-[var(--border)] safe-bottom"
      >
        {NAV_ITEMS.map(({ icon: Icon, label, path, testId }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + "/");
          return (
            <button
              key={path}
              data-testid={testId}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 flex-1 py-2"
            >
              <Icon
                size={22}
                className={active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}
              />
              <span
                className={`text-[10px] font-semibold ${active ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Delete account modal ── */}
      {deleteModalOpen && (
        <div
          data-testid="delete-account-modal"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 px-4 pb-0"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface)] shadow-2xl pb-safe">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <Trash2 size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--text)]">Borrar cuenta</h2>
                <p className="text-[12px] text-[var(--text-muted)]">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <form onSubmit={handleDeleteAccount} className="px-5 py-4">
              <label htmlFor="delete-account-password" className="block text-sm font-semibold text-[var(--text)] mb-2">
                Confirmá tu contraseña
              </label>
              <input
                id="delete-account-password"
                data-testid="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); if (deleteError) setDeleteError(undefined); }}
                autoComplete="current-password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                autoFocus
              />
              {deleteError && (
                <p data-testid="delete-account-error" className="mt-2 text-xs text-rose-400" role="alert">{deleteError}</p>
              )}
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={closeDeleteModal} disabled={deleteAccount.isPending}
                  className="flex-1 rounded-xl border border-[var(--border)] py-3.5 text-sm font-semibold text-[var(--text-muted)] disabled:opacity-60">
                  Cancelar
                </button>
                <button type="submit" disabled={deleteAccount.isPending}
                  className="flex-1 rounded-xl bg-rose-500 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
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
