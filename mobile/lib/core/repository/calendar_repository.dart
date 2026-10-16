import '../api/api_client.dart';
import '../api/calendar_data_source.dart';
import '../models.dart';
import '../storage/calendar_cache.dart';

/// Оффлайн-первый доступ к данным календаря.
///
/// При успешном сетевом запросе результат сохраняется в [CalendarCache].
/// Если сеть недоступна (ошибка соединения), возвращаются данные из кэша.
/// Ошибки уровня бизнес-логики (403/404 и т.п.) не подменяются кэшем.
class CalendarRepository {
  CalendarRepository({required this.source, required this.cache});

  final CalendarDataSource source;
  final CalendarCache cache;

  Future<List<Space>> loadSpaces() async {
    try {
      final spaces = await source.fetchSpaces();
      await cache.writeSpaces(spaces);
      return spaces;
    } on ApiException catch (error) {
      if (!error.isNetwork) {
        rethrow;
      }
      return cache.readSpaces();
    }
  }

  Future<List<CalendarEvent>> loadAllEvents() async {
    try {
      final spaces = await source.fetchSpaces();
      final sources = spaces.expand((space) => space.sources).toList();
      final lists = await Future.wait(
        sources.map((calendarSource) => source.fetchEvents(calendarSource.id)),
      );
      final events = lists.expand((list) => list).toList()
        ..sort((a, b) => a.startAt.compareTo(b.startAt));
      await cache.writeSpaces(spaces);
      await cache.writeEvents(events);
      await cache.writeLastSyncedAt(DateTime.now());
      return events;
    } on ApiException catch (error) {
      if (!error.isNetwork) {
        rethrow;
      }
      return cache.readEvents();
    }
  }
}
