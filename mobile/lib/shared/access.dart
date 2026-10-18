import '../core/models.dart';

/// Правила доступа по пресету участника (зеркало `web/src/hooks/access.ts`
/// и проверок в `web/src/pages/CalendarPage.tsx`).
abstract final class Access {
  /// Полный доступ (управление источниками, участниками и токенами).
  static bool isFull(String? preset) => preset == Preset.full;

  /// Создание/изменение своих событий (полный доступ или «Свои события»).
  static bool canWriteEvents(String? preset) =>
      preset == Preset.full || preset == Preset.own;

  /// Можно ли редактировать конкретное [event]: полный доступ — любые, «Свои
  /// события» — только созданные текущим пользователем ([userId]).
  static bool canEditEvent(
    CalendarEvent event,
    String? preset,
    String? userId,
  ) {
    if (preset == Preset.full) {
      return true;
    }
    return preset == Preset.own && event.creatorId == userId;
  }
}
