import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { LogOut, Plus, Moon, Sun, Monitor, type LucideIcon } from 'lucide-react';
import { fetchSpaces, logoutRequest } from '@/lib/services';
import { navItems } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useViewTransitionNavigate } from '@/hooks/useViewTransitionNavigate';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useViewTransitionNavigate();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [query, setQuery] = useState('');

  const { data: spaces = [] } = useQuery({
    queryKey: ['spaces'],
    queryFn: fetchSpaces,
    enabled: open,
  });

  const handleOpenChange = (next: boolean) => {
    setQuery('');
    onOpenChange(next);
  };

  const run = (action: () => void) => {
    handleOpenChange(false);
    action();
  };

  const onLogout = async () => {
    if (refreshToken) {
      await logoutRequest(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login', { replace: true });
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Командная палитра"
      overlayClassName="fixed inset-0 z-40 animate-fade-in bg-black/60 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[15%] z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-surface shadow-modal"
    >
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Введите команду или поиск…"
        className="w-full border-b border-border bg-transparent px-4 py-3.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none"
      />
      <Command.List className="max-h-[60vh] overflow-auto p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-muted">
        <Command.Empty className="px-3 py-6 text-center text-body-sm text-text-muted">
          Ничего не найдено
        </Command.Empty>

        <Command.Group heading="Навигация">
          {navItems.map((item) => (
            <PaletteItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              onSelect={() => run(() => navigate(item.to))}
            />
          ))}
        </Command.Group>

        <Command.Group heading="Пространства">
          {spaces.length === 0 ? (
            <PaletteItem
              icon={Plus}
              label="Нет пространств"
              disabled
              onSelect={() => undefined}
            />
          ) : (
            spaces.map((space) => (
              <PaletteItem
                key={space.id}
                icon={Plus}
                label={space.name}
                onSelect={() => run(() => navigate(`/spaces/${space.id}`))}
              />
            ))
          )}
        </Command.Group>

        <Command.Group heading="Действия">
          <PaletteItem
            icon={Plus}
            label="Создать событие"
            onSelect={() => run(() => navigate('/calendar'))}
          />
          <PaletteItem
            icon={Moon}
            label="Тёмная тема"
            onSelect={() => run(() => setTheme('dark'))}
          />
          <PaletteItem
            icon={Sun}
            label="Светлая тема"
            onSelect={() => run(() => setTheme('light'))}
          />
          <PaletteItem
            icon={Monitor}
            label="Системная тема"
            onSelect={() => run(() => setTheme('system'))}
          />
          <PaletteItem
            icon={LogOut}
            label="Выйти"
            onSelect={() => run(() => void onLogout())}
          />
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  onSelect,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      disabled={disabled}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-body-sm text-text-secondary data-[selected=true]:bg-bg-elevated data-[selected=true]:text-text-primary data-[disabled=true]:cursor-default data-[disabled=true]:opacity-50"
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Command.Item>
  );
}
