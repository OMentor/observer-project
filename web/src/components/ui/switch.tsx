import { cn } from '@/lib/cn';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out-expo',
        'focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40',
        checked ? 'border-accent bg-accent' : 'border-border bg-bg-elevated',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-bg-surface shadow-card transition-transform duration-150 ease-out-expo',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  );
}
