import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore, type ToastTone } from '@/store/toasts';

const toneStyles: Record<ToastTone, string> = {
  info: 'border-border',
  success: 'border-success/60',
  warning: 'border-accent-2/60',
  danger: 'border-conflict/60',
};

const toneDot: Record<ToastTone, string> = {
  info: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-accent-2',
  danger: 'bg-conflict',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface p-3 shadow-lg',
            toneStyles[toast.tone],
          )}
        >
          <span
            className={cn('mt-1 size-2 shrink-0 rounded-full', toneDot[toast.tone])}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 truncate text-xs text-muted">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Закрыть"
            className="text-muted transition-colors hover:text-text"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
