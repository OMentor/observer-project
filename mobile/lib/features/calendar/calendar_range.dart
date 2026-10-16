/// Чистые функции для режимов календаря (день/неделя/месяц): вычисление
/// границ периода, навигация и подписи. Вынесены отдельно для unit-тестов.
library;

enum CalendarView { day, week, month }

const List<String> _monthsGenitive = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const List<String> _monthsNominative = [
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

DateTime startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

DateTime startOfWeek(DateTime d) {
  final day = startOfDay(d);
  return day.subtract(Duration(days: day.weekday - DateTime.monday));
}

DateTime startOfMonth(DateTime d) => DateTime(d.year, d.month, 1);

DateTime _addMonths(DateTime d, int months) =>
    DateTime(d.year, d.month + months, 1);

/// Начало периода (включительно).
DateTime periodStart(CalendarView view, DateTime anchor) => switch (view) {
  CalendarView.day => startOfDay(anchor),
  CalendarView.week => startOfWeek(anchor),
  CalendarView.month => startOfMonth(anchor),
};

/// Конец периода (исключительно).
DateTime periodEnd(CalendarView view, DateTime anchor) => switch (view) {
  CalendarView.day => startOfDay(anchor).add(const Duration(days: 1)),
  CalendarView.week => startOfWeek(anchor).add(const Duration(days: 7)),
  CalendarView.month => _addMonths(startOfMonth(anchor), 1),
};

/// Сдвиг якорной даты на [delta] периодов вперёд/назад.
DateTime shiftPeriod(CalendarView view, DateTime anchor, int delta) =>
    switch (view) {
      CalendarView.day => startOfDay(anchor).add(Duration(days: delta)),
      CalendarView.week => startOfWeek(anchor).add(Duration(days: 7 * delta)),
      CalendarView.month => _addMonths(startOfMonth(anchor), delta),
    };

/// Пересекается ли событие [start, end) с текущим периодом.
bool overlapsPeriod(
  CalendarView view,
  DateTime anchor,
  DateTime start,
  DateTime end,
) {
  final rangeStart = periodStart(view, anchor);
  final rangeEnd = periodEnd(view, anchor);
  if (!end.isAfter(start)) {
    return !start.isBefore(rangeStart) && start.isBefore(rangeEnd);
  }
  return start.isBefore(rangeEnd) && end.isAfter(rangeStart);
}

String dayLabel(DateTime date) =>
    '${date.day} ${_monthsGenitive[date.month - 1]} ${date.year}';

String periodTitle(CalendarView view, DateTime anchor) => switch (view) {
  CalendarView.day =>
    '${anchor.day} ${_monthsGenitive[anchor.month - 1]} ${anchor.year}',
  CalendarView.week => _weekTitle(anchor),
  CalendarView.month => '${_monthsNominative[anchor.month - 1]} ${anchor.year}',
};

String _weekTitle(DateTime anchor) {
  final start = startOfWeek(anchor);
  final end = start.add(const Duration(days: 6));
  if (start.year == end.year && start.month == end.month) {
    return '${start.day}–${end.day} ${_monthsGenitive[start.month - 1]} '
        '${start.year}';
  }
  if (start.year == end.year) {
    return '${start.day} ${_monthsGenitive[start.month - 1]} – '
        '${end.day} ${_monthsGenitive[end.month - 1]} ${start.year}';
  }
  return '${start.day} ${_monthsGenitive[start.month - 1]} ${start.year} – '
      '${end.day} ${_monthsGenitive[end.month - 1]} ${end.year}';
}
