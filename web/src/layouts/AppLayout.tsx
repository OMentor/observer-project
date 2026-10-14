import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  History,
  KeyRound,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/auth';
import { logoutRequest } from '@/lib/services';

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
}: {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
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

  const onLogout = async () => {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl tracking-tight text-text">
            Плетение
          </span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
            UI-бета
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">{user?.name ?? user?.email}</span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-conflict"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 border-r border-border bg-surface/50 p-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
