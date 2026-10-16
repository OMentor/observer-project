import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-border bg-bg-surface px-4 text-body text-text-primary placeholder:text-text-muted',
        'transition-all duration-150 ease-out-expo outline-none',
        'focus:border-accent focus:shadow-focus',
        error &&
          'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-muted)]',
        className,
      )}
      {...props}
    />
  );
}
