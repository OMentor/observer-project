import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export interface QuarterToolbarProps {
  label: string;
  value: string;
  options: { key: string; start: Date }[];
  onChange: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  kind?: 'quarter' | 'year';
}

export function QuarterToolbar({
  label,
  value,
  options,
  onChange,
  onPrev,
  onNext,
  onToday,
  kind = 'quarter',
}: QuarterToolbarProps) {
  const hasValue = options.some((option) => option.key === value);
  const unit = kind === 'year' ? 'год' : 'квартал';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        onClick={onPrev}
        aria-label={`Предыдущий ${unit}`}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onNext}
        aria-label={`Следующий ${unit}`}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onToday}>
        <CalendarDays className="size-4" />
        Сегодня
      </Button>
      <span className="px-1 text-body font-medium text-text-primary">
        {label}
      </span>
      {options.length > 0 && (
        <Select
          containerClassName="w-[140px]"
          value={hasValue ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`Переход к ${kind === 'year' ? 'году' : 'кварталу'}`}
        >
          {!hasValue && <option value="">{value}</option>}
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.key}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
