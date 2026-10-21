import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  GitMerge,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { navItems } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth';
import { logoutRequest } from '@/lib/services';
import { useRealtime } from '@/hooks/useRealtime';
import { useViewTransitionNavigate } from '@/hooks/useViewTransitionNavigate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectionIndicator } from '@/components/ConnectionIndicator';
import { SyncIndicator } from '@/components/SyncIndicator';
import { ConflictIndicator } from '@/features/sync/ConflictIndicator';
import { CommandPalette } from '@/components/CommandPalette';
import { Toaster } from '@/components/Toaster';
import { SearchInput } from '@/components/SearchInput';
import { Logo } from '@/components/ui/logo';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onClick,
  collapsed,
}: {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-body font-medium transition-colors duration-150 ease-out-expo',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-bg-elevated text-text-primary'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} side="bottom" className="w-full">
        <span className="flex w-full">{link}</span>
      </Tooltip>
    );
  }
  return link;
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const navigate = useViewTransitionNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useRealtime();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const onLogout = async () => {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login', { replace: true });
  };

  const items = useMemo(() => {
    const visible = navItems.filter(
      (item) => !item.adminOnly || user?.role === 'ADMIN',
    );
    const q = query.trim().toLowerCase();
    if (!q) {
      return visible;
    }
    return visible.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, user?.role]);

  const nav = (isCollapsed: boolean) => (
    <nav aria-label="Основная навигация" className="flex flex-col gap-1">
      {items.map((item) => (
        <NavItem
          key={item.to}
          {...item}
          collapsed={isCollapsed}
          onClick={() => setMenuOpen(false)}
        />
      ))}
    </nav>
  );

  const displayName = user?.name ?? user?.email ?? 'Профиль';

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-bg px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
          className="inline-flex size-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary lg:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <div className="flex items-center gap-2">
          <Logo size={32} animated />
          <span className="font-serif text-h4 tracking-tight text-text-primary">
            Плетение
          </span>
        </div>

        <div
          className="ml-2 hidden max-w-[480px] flex-1 cursor-text md:block"
          onClick={() => setPaletteOpen(true)}
        >
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Поиск разделов…"
          />
        </div>

        <div className="flex-1" />

        <SyncIndicator />
        <ConflictIndicator />
        <ConnectionIndicator />
        <button
          type="button"
          onClick={() => navigate('/history')}
          aria-label="История изменений"
          title="История изменений"
          className="relative inline-flex size-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          <Bell className="size-5" />
        </button>
        <ThemeToggle />
        <Dropdown
          trigger={
            <button
              type="button"
              aria-label="Меню профиля"
              className="rounded-full focus-visible:outline-none focus-visible:shadow-focus"
            >
              <Avatar name={displayName} size={32} />
            </button>
          }
        >
          <div className="px-3 py-2">
            <p className="truncate text-body-sm font-medium text-text-primary">
              {displayName}
            </p>
          </div>
          <DropdownItem
            icon={<UserRound className="size-4" />}
            onSelect={() => navigate('/profile')}
          >
            Профиль
          </DropdownItem>
          <DropdownItem
            icon={<Settings className="size-4" />}
            onSelect={() => navigate('/settings')}
          >
            Настройки
          </DropdownItem>
          <DropdownItem
            icon={<GitMerge className="size-4" />}
            onSelect={() => navigate('/sync/conflicts')}
          >
            Конфликты синхронизации
          </DropdownItem>
          <DropdownItem
            icon={<LogOut className="size-4" />}
            danger
            onSelect={onLogout}
          >
            Выйти
          </DropdownItem>
        </Dropdown>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <aside
          className={cn(
            'hidden shrink-0 flex-col border-r border-border bg-bg transition-all duration-250 ease-out-expo lg:flex',
            collapsed ? 'w-16' : 'w-[280px]',
          )}
        >
          <div className="flex-1 overflow-auto p-3">{nav(collapsed)}</div>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
              title={collapsed ? 'Развернуть' : 'Свернуть'}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary',
                collapsed ? 'w-full justify-center' : 'w-full px-3',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" />
                  <span className="text-body-sm">Свернуть</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 z-20 bg-black/40 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <aside className="fixed bottom-0 left-0 top-16 z-30 w-[280px] animate-slide-in-right border-r border-border bg-bg p-3 lg:hidden">
              {nav(false)}
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px] animate-fade-in">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
    </div>
  );
}
