import '../../core/models.dart';
import '../../shared/format.dart';

/// Одна строка сравнения версий события.
class ConflictDiffRow {
  const ConflictDiffRow({
    required this.label,
    required this.local,
    required this.external,
    required this.changed,
  });

  final String label;
  final String local;
  final String external;
  final bool changed;
}

/// Подпись времени снимка: «Весь день» или «05.12.2026, 10:00 – 11:00».
String formatSnapshotWhen(EventSnapshot snapshot) {
  if (snapshot.allDay) {
    return '${formatDate(snapshot.startAt)}, весь день';
  }
  return '${formatDate(snapshot.startAt)}, '
      '${formatTimeRange(snapshot.startAt, snapshot.endAt)}';
}

/// Текст поля либо «—» для пустого/отсутствующего значения.
String formatSnapshotText(String? value) {
  final text = value?.trim() ?? '';
  return text.isEmpty ? '—' : text;
}

bool _sameMoment(DateTime a, DateTime b) => a.isAtSameMomentAs(b);

/// Полный список полей для сравнения (включая неизменённые).
List<ConflictDiffRow> conflictDiff(ConflictItem conflict) {
  final local = conflict.localData;
  final external = conflict.externalData;

  final localWhen = formatSnapshotWhen(local);
  final externalWhen = formatSnapshotWhen(external);

  return [
    ConflictDiffRow(
      label: 'Название',
      local: formatSnapshotText(local.title),
      external: formatSnapshotText(external.title),
      changed: local.title != external.title,
    ),
    ConflictDiffRow(
      label: 'Время',
      local: localWhen,
      external: externalWhen,
      changed: local.allDay != external.allDay ||
          !_sameMoment(local.startAt, external.startAt) ||
          !_sameMoment(local.endAt, external.endAt),
    ),
    ConflictDiffRow(
      label: 'Место',
      local: formatSnapshotText(local.location),
      external: formatSnapshotText(external.location),
      changed: (local.location ?? '') != (external.location ?? ''),
    ),
    ConflictDiffRow(
      label: 'Описание',
      local: formatSnapshotText(local.description),
      external: formatSnapshotText(external.description),
      changed: (local.description ?? '') != (external.description ?? ''),
    ),
  ];
}
