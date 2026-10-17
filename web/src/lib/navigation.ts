import {
  BarChart3,
  CalendarDays,
  History,
  KeyRound,
  LayoutGrid,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  { to: '/', label: 'Пространства', icon: LayoutGrid, end: true },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/tokens', label: 'Токены', icon: KeyRound },
  { to: '/members', label: 'Участники', icon: Users },
  { to: '/history', label: 'История', icon: History },
  { to: '/settings', label: 'Настройки', icon: Settings },
  { to: '/profile', label: 'Профиль', icon: UserRound },
  {
    to: '/analytics',
    label: 'Аналитика',
    icon: BarChart3,
    adminOnly: true,
  },
];
