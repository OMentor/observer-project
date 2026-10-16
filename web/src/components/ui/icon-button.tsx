import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  label: string;
  variant?: 'ghost' | 'danger';
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md transition-colors duration-150 ease-out-expo',
        'focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40',
        variant === 'ghost'
          ? 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          : 'text-text-muted hover:bg-danger-muted hover:text-danger',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
