import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore, type ToastTone } from '@/store/toasts';

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const;

const toneColor: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  warning: 'text-amber',
  danger: 'text-danger',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-[calc(100vw-3rem)] max-w-[420px] flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toneIcon[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex min-w-[320px] animate-slide-in-right items-start gap-3 rounded-lg border border-border bg-bg-surface p-4 shadow-dropdown"
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', toneColor[toast.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium text-text-primary">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-body-sm text-text-secondary">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Закрыть"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
