import { useCallback, useMemo, useState } from 'react';
import {
  QUARTER_MONTHS,
  addMonths,
  windowKey,
  windowLabel,
  windowStart,
  quarterRange,
  type QuarterWindow,
} from '@/features/calendar/lib/quarterRange';

export type QuarterNavigation = {
  start: Date;
  range: QuarterWindow;
  today: Date;
  label: string;
  key: string;
  next: () => void;
  prev: () => void;
  goToday: () => void;
  goTo: (date: Date) => void;
};

export function useQuarterNavigation(
  initial?: Date,
  count = QUARTER_MONTHS,
): QuarterNavigation {
  const [today] = useState(() => new Date());
  const [start, setStart] = useState(() =>
    windowStart(initial ?? today, count),
  );

  const range = useMemo(() => quarterRange(start, count), [start, count]);

  const next = useCallback(
    () => setStart((current) => addMonths(current, count)),
    [count],
  );
  const prev = useCallback(
    () => setStart((current) => addMonths(current, -count)),
    [count],
  );
  const goToday = useCallback(
    () => setStart(windowStart(new Date(), count)),
    [count],
  );
  const goTo = useCallback(
    (date: Date) => setStart(windowStart(date, count)),
    [count],
  );

  const label = useMemo(
    () => windowLabel(range.months),
    [range.months],
  );
  const key = useMemo(
    () => windowKey(range.start, count),
    [range.start, count],
  );

  return { start, range, today, label, key, next, prev, goToday, goTo };
}
