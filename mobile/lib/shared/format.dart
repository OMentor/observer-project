/// Форматирование дат и времени (зеркало `ru-RU` из web: `toLocaleString('ru-RU')`,
/// `formatTime`/`dayTitle` в `web/src/features/calendar/lib/daySections.ts`).
library;

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

const List<String> _weekdaysFull = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
];

String _two(int value) => value.toString().padLeft(2, '0');

/// `ЧЧ:ММ`.
String formatTime(DateTime date) => '${_two(date.hour)}:${_two(date.minute)}';

/// `ДД.ММ.ГГГГ`.
String formatDate(DateTime date) =>
    '${_two(date.day)}.${_two(date.month)}.${date.year}';

/// `ДД.ММ.ГГГГ, ЧЧ:ММ`.
String formatDateTime(DateTime date) =>
    '${formatDate(date)}, ${formatTime(date)}';

/// `18 октября, воскресенье` (как `dayTitle` в daySections.ts).
String formatDayTitle(DateTime date) =>
    '${date.day} ${_monthsGenitive[date.month - 1]}, '
    '${_weekdaysFull[date.weekday % 7]}';

/// Диапазон времени события, напр. `09:00 – 10:30`.
String formatTimeRange(DateTime start, DateTime end) =>
    '${formatTime(start)} – ${formatTime(end)}';
