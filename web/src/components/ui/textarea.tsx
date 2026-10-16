import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-[80px] w-full resize-none rounded-md border border-border bg-bg-surface px-4 py-3 text-body text-text-primary placeholder:text-text-muted',
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
