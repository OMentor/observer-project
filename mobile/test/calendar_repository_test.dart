import 'package:flutter_test/flutter_test.dart';
import 'package:pletenie_mobile/core/api/api_client.dart';
import 'package:pletenie_mobile/core/api/calendar_data_source.dart';
import 'package:pletenie_mobile/core/models.dart';
import 'package:pletenie_mobile/core/repository/calendar_repository.dart';
import 'package:pletenie_mobile/core/storage/calendar_cache.dart';

Space _space(String id, {List<Source> sources = const []}) => Space(
  id: id,
  name: 'Пространство $id',
  ownerId: 'owner',
  createdAt: '2026-01-01T00:00:00.000Z',
  sources: sources,
);

Source _source(String id, String spaceId) => Source(
  id: id,
  spaceId: spaceId,
  ownerId: 'owner',
  name: 'Источник $id',
  color: '#5B5FEF',
  visibility: 'SHARED',
  createdAt: '2026-01-01T00:00:00.000Z',
);

CalendarEvent _event(String id, String sourceId, DateTime start) =>
    CalendarEvent(
      id: id,
      sourceId: sourceId,
      creatorId: 'creator',
      title: 'Событие $id',
      startAt: start,
      endAt: start.add(const Duration(hours: 1)),
      allDay: false,
      timezone: 'UTC',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    );

class FakeSource implements CalendarDataSource {
  FakeSource({this.spaces = const [], this.events = const {}, this.error});

  List<Space> spaces;
  Map<String, List<CalendarEvent>> events;
  ApiException? error;
  int spacesCalls = 0;
  int eventsCalls = 0;

  @override
  Future<List<Space>> fetchSpaces() async {
    spacesCalls++;
    if (error != null) {
      throw error!;
    }
    return spaces;
  }

  @override
  Future<List<CalendarEvent>> fetchEvents(String sourceId) async {
    eventsCalls++;
    if (error != null) {
      throw error!;
    }
    return events[sourceId] ?? const [];
  }
}

class FakeCache implements CalendarCache {
  List<Space> spaces = [];
  List<CalendarEvent> events = [];
  DateTime? lastSynced;

  @override
  Future<List<Space>> readSpaces() async => spaces;

  @override
  Future<void> writeSpaces(List<Space> value) async => spaces = value;

  @override
  Future<List<CalendarEvent>> readEvents() async => events;

  @override
  Future<void> writeEvents(List<CalendarEvent> value) async => events = value;

  @override
  Future<DateTime?> readLastSyncedAt() async => lastSynced;

  @override
  Future<void> writeLastSyncedAt(DateTime value) async => lastSynced = value;
}

void main() {
  group('loadSpaces', () {
    test('успешная загрузка сохраняется в кэш', () async {
      final source = FakeSource(spaces: [_space('s1')]);
      final cache = FakeCache();
      final repository = CalendarRepository(source: source, cache: cache);

      final result = await repository.loadSpaces();

      expect(result, hasLength(1));
      expect(cache.spaces, hasLength(1));
      expect(cache.spaces.first.id, 's1');
    });

    test('при ошибке сети возвращаются данные из кэша', () async {
      final source = FakeSource(
        error: ApiException('нет сети', isNetwork: true),
      );
      final cache = FakeCache()..spaces = [_space('cached')];
      final repository = CalendarRepository(source: source, cache: cache);

      final result = await repository.loadSpaces();

      expect(result.single.id, 'cached');
    });

    test('ошибка не-сетевого уровня пробрасывается', () async {
      final source = FakeSource(error: ApiException('доступ запрещён'));
      final cache = FakeCache()..spaces = [_space('cached')];
      final repository = CalendarRepository(source: source, cache: cache);

      expect(() => repository.loadSpaces(), throwsA(isA<ApiException>()));
    });
  });

  group('loadAllEvents', () {
    test('агрегирует, сортирует и кэширует события', () async {
      final morning = DateTime(2026, 10, 16, 9);
      final evening = DateTime(2026, 10, 16, 18);
      final source = FakeSource(
        spaces: [
          _space('s1', sources: [_source('src1', 's1'), _source('src2', 's1')]),
        ],
        events: {
          'src1': [_event('e2', 'src1', evening)],
          'src2': [_event('e1', 'src2', morning)],
        },
      );
      final cache = FakeCache();
      final repository = CalendarRepository(source: source, cache: cache);

      final result = await repository.loadAllEvents();

      expect(result.map((e) => e.id).toList(), ['e1', 'e2']);
      expect(cache.events, hasLength(2));
      expect(cache.lastSynced, isNotNull);
    });

    test('при ошибке сети возвращает события из кэша', () async {
      final source = FakeSource(
        error: ApiException('нет сети', isNetwork: true),
      );
      final cache = FakeCache()
        ..events = [_event('cached', 'src', DateTime(2026, 10, 16, 12))];
      final repository = CalendarRepository(source: source, cache: cache);

      final result = await repository.loadAllEvents();

      expect(result.single.id, 'cached');
    });
  });
}
