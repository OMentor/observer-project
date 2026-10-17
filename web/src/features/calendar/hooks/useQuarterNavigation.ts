import { useCallback, useMemo, useState } from 'react';
import {
  QUARTER_MONTHS,
  addMonths,
  quarterKey,
  quarterRange,
  startOfQuarter,
  windowLabel,
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
    startOfQuarter(initial ?? today),
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
    () => setStart(startOfQuarter(new Date())),
    [],
  );
  const goTo = useCallback(
    (date: Date) => setStart(startOfQuarter(date)),
    [],
  );

  const label = useMemo(
    () => windowLabel(range.months),
    [range.months],
  );
  const key = useMemo(() => quarterKey(range.start), [range.start]);

  return { start, range, today, label, key, next, prev, goToday, goTo };
}
