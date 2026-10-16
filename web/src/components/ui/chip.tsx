import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps {
  children: ReactNode;
  color?: string;
  icon?: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ children, color, icon, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-2.5 py-1 text-caption text-text-primary',
        className,
      )}
    >
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      )}
      {icon != null && <span aria-hidden>{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Убрать"
          className="text-text-muted transition-colors hover:text-text-primary"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
