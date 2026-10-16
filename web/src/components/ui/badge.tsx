import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone =
  | 'success'
  | 'accent'
  | 'amber'
  | 'danger'
  | 'muted'
  | 'neutral';

const TONES: Record<BadgeTone, string> = {
  success: 'bg-success-muted text-success',
  accent: 'bg-accent-muted text-accent',
  amber: 'bg-amber-muted text-amber',
  danger: 'bg-danger-muted text-danger',
  muted: 'bg-bg-elevated text-text-muted',
  neutral: 'bg-bg-elevated text-text-secondary',
};

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Badge({
  tone = 'neutral',
  icon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon != null && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}
