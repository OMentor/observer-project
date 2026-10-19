const MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTHS_SHORT = [
  'янв.',
  'февр.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сент.',
  'окт.',
  'нояб.',
  'дек.',
];

export const QUARTER_MONTHS = 4;
export const YEAR_MONTHS = 12;

export function isYearWindow(count: number): boolean {
  return count >= YEAR_MONTHS;
}

export type QuarterWindow = {
  start: Date;
  end: Date;
  months: Date[];
  label: string;
  key: string;
};

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function startOfQuarter(date: Date): Date {
  const month = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), month, 1);
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function windowStart(date: Date, count: number): Date {
  return isYearWindow(count) ? startOfYear(date) : startOfQuarter(date);
}

export function windowKey(start: Date, count: number): string {
  return isYearWindow(count) ? String(start.getFullYear()) : quarterKey(start);
}

export function monthLabel(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

export function windowLabel(months: Date[]): string {
  if (months.length === 0) {
    return '';
  }
  const first = months[0];
  const last = months[months.length - 1];
  if (
    months.length === YEAR_MONTHS &&
    first.getMonth() === 0 &&
    last.getMonth() === 11 &&
    first.getFullYear() === last.getFullYear()
  ) {
    return String(first.getFullYear());
  }
  const startLabel = MONTHS_SHORT[first.getMonth()];
  const endLabel = MONTHS_SHORT[last.getMonth()];
  if (first.getFullYear() === last.getFullYear()) {
    return `${startLabel} – ${endLabel} ${last.getFullYear()}`;
  }
  return `${startLabel} ${first.getFullYear()} – ${endLabel} ${last.getFullYear()}`;
}

export function quarterKey(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function quarterRange(
  anchor: Date,
  count = QUARTER_MONTHS,
): QuarterWindow {
  const start = windowStart(anchor, count);
  const months = Array.from({ length: count }, (_, index) =>
    addMonths(start, index),
  );
  const end = addMonths(start, count);
  return {
    start,
    end,
    months,
    label: windowLabel(months),
    key: windowKey(start, count),
  };
}

export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = (day + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
}

export function monthGrid(month: Date): Date[][] {
  const first = startOfMonth(month);
  const gridStart = startOfWeek(first);
  const weeks: Date[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(
        new Date(
          gridStart.getFullYear(),
          gridStart.getMonth(),
          gridStart.getDate() + week * 7 + day,
        ),
      );
    }
    weeks.push(days);
  }
  return weeks;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WEEKDAYS_WORK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
