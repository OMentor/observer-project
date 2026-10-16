import { cn } from '@/lib/cn';
import { useRealtimeStore, type RealtimeStatus } from '@/store/realtime';

const labels: Record<RealtimeStatus, string> = {
  connecting: 'Подключение…',
  connected: 'Онлайн',
  disconnected: 'Офлайн',
};

const dotStyles: Record<RealtimeStatus, string> = {
  connecting: 'bg-accent-2 animate-pulse',
  connected: 'bg-success',
  disconnected: 'bg-muted',
};

export function ConnectionIndicator() {
  const status = useRealtimeStore((s) => s.status);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title={`Real-time: ${labels[status]}`}
    >
      <span className={cn('size-2 rounded-full', dotStyles[status])} />
      <span className="hidden sm:inline">{labels[status]}</span>
    </span>
  );
}
