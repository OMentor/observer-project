import { useQuery } from '@tanstack/react-query';
import { fetchFunnel } from '@/lib/services';
import type { FunnelStep } from '@/lib/types';

function FunnelRow({
  step,
  previous,
  total,
}: {
  step: FunnelStep;
  previous?: FunnelStep;
  total: number;
}) {
  const width = total > 0 ? Math.max((step.count / total) * 100, 2) : 0;
  const conversion =
    previous && previous.count > 0
      ? Math.round((step.count / previous.count) * 100)
      : null;

  return (
    <li className="space-y-1.5" data-testid={`funnel-step-${step.key}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body font-medium text-text-primary">
          {step.label}
        </span>
        <span className="flex items-baseline gap-2">
          <span
            className="text-h4 font-semibold text-text-primary"
            data-testid="funnel-count"
          >
            {step.count}
          </span>
          {conversion !== null && (
            <span className="text-caption text-text-muted">{conversion}%</span>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out-expo"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

export function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: fetchFunnel,
  });

  const steps = data?.steps ?? [];
  const total = steps[0]?.count ?? 0;

  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-h1 text-text-primary">Аналитика</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Воронка активации: от регистрации до первого события.
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-bg-surface p-5 shadow-card">
        {isLoading && <p className="text-body-sm text-text-muted">Загрузка…</p>}
        {isError && (
          <p role="alert" className="text-body-sm text-danger">
            Не удалось загрузить данные.
          </p>
        )}
        {!isLoading && !isError && (
          <ol className="space-y-4" data-testid="funnel">
            {steps.map((step, index) => (
              <FunnelRow
                key={step.key}
                step={step}
                previous={steps[index - 1]}
                total={total}
              />
            ))}
          </ol>
        )}
      </div>

      {data && (
        <p className="text-caption text-text-muted">
          Обновлено: {new Date(data.generated_at).toLocaleString('ru-RU')}
        </p>
      )}
    </section>
  );
}
