import '../models.dart';

/// Источник календарных данных. Реализуется [ApiClient] (сеть) и может быть
/// подменён в тестах/оффлайн-сценариях.
abstract class CalendarDataSource {
  Future<List<Space>> fetchSpaces();

  Future<List<CalendarEvent>> fetchEvents(String sourceId);
}
