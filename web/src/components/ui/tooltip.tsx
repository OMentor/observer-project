import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TooltipProps {
  label: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
  children: ReactNode;
}

export function Tooltip({ label, side = 'top', className, children }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2 py-1 text-caption text-text-primary opacity-0 shadow-dropdown transition-opacity duration-150 ease-out-expo group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}
