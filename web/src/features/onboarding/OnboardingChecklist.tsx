import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import type { OnboardingStep } from '@/lib/onboarding';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

export interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onCreateSpace?: () => void;
  onDismiss: () => void;
}

export function OnboardingChecklist({
  steps,
  onCreateSpace,
  onDismiss,
}: OnboardingChecklistProps) {
  const activeIndex = steps.findIndex((step) => !step.done);

  return (
    <section
      aria-label="Начало работы"
      data-testid="onboarding"
      className="rounded-lg border border-border bg-bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-h3 text-text-primary">
            Начало работы
          </h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            Три шага, чтобы начать пользоваться «Плетением».
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Скрыть подсказки"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={step.key}
              data-testid={`onboarding-step-${step.key}`}
              data-done={step.done}
              data-active={isActive}
              className={cn(
                'flex items-start gap-3 rounded-md border p-3 transition-colors',
                step.done
                  ? 'border-border-subtle bg-bg-surface'
                  : isActive
                    ? 'border-accent bg-accent-muted/40'
                    : 'border-border-subtle',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-medium',
                  step.done
                    ? 'bg-success-muted text-success'
                    : isActive
                      ? 'bg-accent text-on-accent'
                      : 'bg-bg-elevated text-text-muted',
                )}
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-body',
                    step.done ? 'text-text-secondary' : 'text-text-primary',
                  )}
                >
                  {step.title}
                </p>
                {!step.done && (
                  <p className="mt-0.5 text-body-sm text-text-secondary">
                    {step.description}
                  </p>
                )}
              </div>

              {isActive &&
                !step.done &&
                (step.to ? (
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={step.to}>
                      {step.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" onClick={onCreateSpace}>
                    {step.cta}
                  </Button>
                ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
