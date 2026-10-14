import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  History,
  KeyRound,
  Settings,
  Users,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { to: '/', label: 'Календарь', icon: CalendarDays, end: true },
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
        <div className="text-sm text-muted">Локальный режим</div>
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
