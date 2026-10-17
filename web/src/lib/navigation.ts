import {
  CalendarDays,
  History,
  KeyRound,
  LayoutGrid,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';

export const navItems = [
  { to: '/', label: 'Пространства', icon: LayoutGrid, end: true },
  { to: '/calendar', label: 'Календарь', icon: CalendarDays },
  { to: '/tokens', label: 'Токены', icon: KeyRound },
  { to: '/members', label: 'Участники', icon: Users },
  { to: '/history', label: 'История', icon: History },
  { to: '/settings', label: 'Настройки', icon: Settings },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];
