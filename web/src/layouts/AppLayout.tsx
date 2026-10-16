import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  History,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/auth';
import { logoutRequest } from '@/lib/services';
import { useRealtime } from '@/hooks/useRealtime';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectionIndicator } from '@/components/ConnectionIndicator';
import { Toaster } from '@/components/Toaster';

const navItems = [
  { to: '/', label: 'Пространства', icon: LayoutGrid, end: true },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/tokens', label: 'Токены', icon: KeyRound },
  { to: '/members', label: 'Участники', icon: Users },
  { to: '/history', label: 'История', icon: History },
  { to: '/settings', label: 'Настройки', icon: Settings },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent/15 text-accent'
            : 'text-muted hover:bg-surface hover:text-text',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const [menuOpen, setMenuOpen] = useState(false);

  useRealtime();

  const onLogout = async () => {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavItem
          key={item.to}
          {...item}
          onClick={() => setMenuOpen(false)}
        />
      ))}
    </nav>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Меню"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bg hover:text-text lg:hidden"
          >
            {menuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
          <span className="font-serif text-xl tracking-tight text-text">
            Плетение
          </span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
            UI-бета
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <ConnectionIndicator />
          <span className="hidden text-muted sm:inline">
            {user?.name ?? user?.email}
          </span>
          <ThemeToggle />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-conflict"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/50 p-3 lg:block">
          {sidebar}
        </aside>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-20 bg-black/40 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <aside
              className="fixed bottom-0 left-0 top-14 z-30 w-60 border-r border-border bg-surface p-3 lg:hidden"
            >
              {sidebar}
            </aside>
          </>
        )}
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
