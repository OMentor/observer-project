import '../../core/models.dart';

/// Откуда взять поле при объединении.
enum FieldChoice { local, external, own }

/// Состояние и правила режима «Объединить» (зеркало web-диалога).
///
/// Время выбирается целиком из одной версии — собрать его из половинок нельзя.
class MergeSelection {
  MergeSelection(this.conflict) {
    titleOwn = conflict.localData.title;
    descriptionOwn = conflict.localData.description ?? '';
    locationOwn = conflict.localData.location ?? '';
  }

  final ConflictItem conflict;

  FieldChoice title = FieldChoice.local;
  FieldChoice description = FieldChoice.local;
  FieldChoice location = FieldChoice.local;
  bool useExternalTime = false;

  late String titleOwn;
  late String descriptionOwn;
  late String locationOwn;

  EventSnapshot get local => conflict.localData;
  EventSnapshot get external => conflict.externalData;

  DateTime get startAt => useExternalTime ? external.startAt : local.startAt;
  DateTime get endAt => useExternalTime ? external.endAt : local.endAt;

  bool get titleInvalid =>
      title == FieldChoice.own && titleOwn.trim().isEmpty;

  bool get timeInvalid => endAt.isBefore(startAt);

  bool get isValid => !titleInvalid && !timeInvalid;

  String? get errorText {
    if (titleInvalid) {
      return 'Название не может быть пустым.';
    }
    if (timeInvalid) {
      return 'Конец события раньше начала.';
    }
    return null;
  }

  /// Тело `POST /sync/conflicts/:id/resolve` для `resolution: merged`.
  Map<String, dynamic> buildPayload() {
    final merged = <String, dynamic>{};

    switch (title) {
      case FieldChoice.external:
        merged['title'] = external.title;
      case FieldChoice.own:
        merged['title'] = titleOwn.trim();
      case FieldChoice.local:
        break;
    }

    switch (description) {
      case FieldChoice.external:
        merged['description'] = external.description;
      case FieldChoice.own:
        merged['description'] =
            descriptionOwn.trim().isEmpty ? null : descriptionOwn.trim();
      case FieldChoice.local:
        break;
    }

    if (useExternalTime) {
      merged['start_at'] = external.startAt.toUtc().toIso8601String();
      merged['end_at'] = external.endAt.toUtc().toIso8601String();
      merged['all_day'] = external.allDay;
    }

    switch (location) {
      case FieldChoice.external:
        merged['location'] = external.location;
      case FieldChoice.own:
        merged['location'] =
            locationOwn.trim().isEmpty ? null : locationOwn.trim();
      case FieldChoice.local:
        break;
    }

    return {'resolution': 'merged', 'merged_data': merged};
  }
}
