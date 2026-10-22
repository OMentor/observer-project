import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pletenie_mobile/app.dart';
import 'package:pletenie_mobile/core/models.dart';
import 'package:pletenie_mobile/core/network/connectivity_service.dart';
import 'package:pletenie_mobile/core/theme/app_theme.dart';
import 'package:pletenie_mobile/features/sync/conflict_card.dart';
import 'package:pletenie_mobile/features/sync/conflict_format.dart';
import 'package:pletenie_mobile/features/sync/conflict_merge.dart';
import 'package:pletenie_mobile/features/sync/conflict_resolve_screen.dart';
import 'package:pletenie_mobile/features/sync/conflicts_screen.dart';
import 'package:pletenie_mobile/shared/widgets/app_event_tile.dart';

EventSnapshot _snapshot({
  String title = 'Встреча с клиентом',
  String? description,
  String? location = 'Офис',
  DateTime? start,
  DateTime? end,
}) {
  final startAt = start ?? DateTime(2026, 12, 5, 10);
  return EventSnapshot(
    title: title,
    description: description,
    startAt: startAt,
    endAt: end ?? startAt.add(const Duration(hours: 1)),
    allDay: false,
    timezone: 'UTC',
    location: location,
  );
}

ConflictItem _conflict({String title = 'Встреча с клиентом'}) {
  final local = _snapshot(title: title);
  final external = _snapshot(
    title: 'Встреча с Аней',
    description: 'Новое описание',
    location: null,
    start: DateTime(2026, 12, 5, 10, 30),
    end: DateTime(2026, 12, 5, 11, 30),
  );
  return ConflictItem(
    id: 'c1',
    eventId: 'e1',
    connectionId: 'conn1',
    localData: local,
    externalData: external,
    externalEtag: '"etag-2"',
    createdAt: DateTime(2026, 12, 5, 9),
    event: ConflictEventRef(id: 'e1', title: title, sourceId: 's1'),
  );
}

Widget _app(Widget child) =>
    MaterialApp(theme: AppTheme.dark(), home: child);

Widget _conflictsApp({
  required List<ConflictItem> items,
  bool online = true,
}) {
  return ProviderScope(
    overrides: [
      isOnlineProvider.overrideWithValue(online),
      conflictsProvider.overrideWith((ref) async => items),
      spacesProvider.overrideWith((ref) async => const <Space>[]),
    ],
    child: _app(const ConflictsScreen()),
  );
}

void main() {
  group('модели синхронизации', () {
    test('CalendarEvent читает sync_status и считает конфликт', () {
      Map<String, dynamic> json(String status) => {
            'id': 'e1',
            'source_id': 's1',
            'creator_id': 'u1',
            'title': 'Встреча',
            'start_at': '2026-12-05T10:00:00.000Z',
            'end_at': '2026-12-05T11:00:00.000Z',
            'all_day': false,
            'timezone': 'UTC',
            'created_at': '2026-12-05T09:00:00.000Z',
            'updated_at': '2026-12-05T09:00:00.000Z',
            'sync_status': status,
          };

      expect(CalendarEvent.fromJson(json('conflict')).hasConflict, isTrue);
      expect(CalendarEvent.fromJson(json('synced')).hasConflict, isFalse);
    });

    test('ConflictItem парсит снимки и ссылку на событие', () {
      final item = ConflictItem.fromJson({
        'id': 'c1',
        'event_id': 'e1',
        'connection_id': 'conn1',
        'local_data': _snapshot().toJson(),
        'external_data': _snapshot(title: 'Внешняя').toJson(),
        'external_etag': '"e2"',
        'resolution': 'merged',
        'resolved_at': null,
        'created_at': '2026-12-05T09:00:00.000Z',
        'event': {'id': 'e1', 'title': 'Встреча', 'source_id': 's1'},
      });

      expect(item.localData.title, 'Встреча с клиентом');
      expect(item.externalData.title, 'Внешняя');
      expect(item.resolution, ConflictResolution.merged);
      expect(item.event.sourceId, 's1');
      expect(item.localData.startAt.isUtc, isFalse);
    });

    test('conflictDiff отмечает изменения и форматирует время', () {
      final rows = conflictDiff(_conflict());
      expect(rows, hasLength(4));
      expect(rows.map((row) => row.label), [
        'Название',
        'Время',
        'Место',
        'Описание',
      ]);
      expect(rows.every((row) => row.changed), isTrue);
      expect(
        formatSnapshotWhen(_snapshot()),
        '05.12.2026, 10:00 – 11:00',
      );
      expect(formatSnapshotText(null), '—');
    });
  });

  group('MergeSelection', () {
    test('по умолчанию берёт локальные поля', () {
      final selection = MergeSelection(_conflict());
      expect(selection.buildPayload(), {
        'resolution': 'merged',
        'merged_data': <String, dynamic>{},
      });
    });

    test('собирает внешнее название, время и описание', () {
      final selection = MergeSelection(_conflict())
        ..title = FieldChoice.external
        ..description = FieldChoice.external
        ..useExternalTime = true;

      final payload = selection.buildPayload();
      final merged = payload['merged_data'] as Map<String, dynamic>;

      expect(payload['resolution'], 'merged');
      expect(merged['title'], 'Встреча с Аней');
      expect(merged['description'], 'Новое описание');
      expect(
        merged['start_at'],
        DateTime(2026, 12, 5, 10, 30).toUtc().toIso8601String(),
      );
      expect(
        merged['end_at'],
        DateTime(2026, 12, 5, 11, 30).toUtc().toIso8601String(),
      );
      expect(merged['all_day'], isFalse);
    });

    test('своё пустое название блокирует сохранение', () {
      final selection = MergeSelection(_conflict())
        ..title = FieldChoice.own
        ..titleOwn = '   ';

      expect(selection.titleInvalid, isTrue);
      expect(selection.isValid, isFalse);
      expect(selection.errorText, 'Название не может быть пустым.');
    });

    test('пустое своё место очищает поле (null)', () {
      final selection = MergeSelection(_conflict())
        ..location = FieldChoice.own
        ..locationOwn = '';

      final merged =
          selection.buildPayload()['merged_data'] as Map<String, dynamic>;
      expect(merged.containsKey('location'), isTrue);
      expect(merged['location'], isNull);
    });
  });

  group('ConflictCard', () {
    testWidgets('показывает заголовок, источник и различия', (tester) async {
      await tester.pumpWidget(
        _app(
          Scaffold(
            body: ConflictCard(
              conflict: _conflict(),
              sourceLabel: 'Работа / Команда',
              onResolve: () {},
            ),
          ),
        ),
      );

      expect(find.text('Встреча с клиентом'), findsNWidgets(2));
      expect(find.textContaining('Работа / Команда'), findsOneWidget);
      expect(find.text('Встреча с Аней'), findsOneWidget);
      expect(find.text('Наша'), findsNWidgets(2));
    });

    testWidgets('кнопка «Разрешить» вызывает обработчик', (tester) async {
      var tapped = 0;
      await tester.pumpWidget(
        _app(
          Scaffold(
            body: ConflictCard(
              conflict: _conflict(),
              onResolve: () => tapped++,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Разрешить'));
      await tester.pump();
      expect(tapped, 1);
    });
  });

  group('ConflictsScreen', () {
    testWidgets('показывает список конфликтов', (tester) async {
      await tester.pumpWidget(_conflictsApp(items: [_conflict()]));
      await tester.pumpAndSettle();

      expect(find.text('Конфликты'), findsOneWidget);
      expect(find.text('Встреча с клиентом'), findsNWidgets(2));
      expect(find.text('Разрешить'), findsOneWidget);
    });

    testWidgets('показывает пустое состояние', (tester) async {
      await tester.pumpWidget(_conflictsApp(items: const []));
      await tester.pumpAndSettle();

      expect(find.text('Нет конфликтов'), findsOneWidget);
    });

    testWidgets('оффлайн показывает «Нет соединения»', (tester) async {
      await tester.pumpWidget(
        _conflictsApp(items: const [], online: false),
      );
      await tester.pumpAndSettle();

      expect(find.text('Нет соединения'), findsOneWidget);
      expect(find.text('Нет конфликтов'), findsNothing);
    });

    testWidgets('во время загрузки показывает индикатор', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            isOnlineProvider.overrideWithValue(true),
            conflictsProvider.overrideWith(
              (ref) => Future<List<ConflictItem>>.delayed(
                const Duration(seconds: 1),
                () => const [],
              ),
            ),
            spacesProvider.overrideWith((ref) async => const <Space>[]),
          ],
          child: _app(const ConflictsScreen()),
        ),
      );
      await tester.pump();

      expect(find.text('Загружаем конфликты…'), findsOneWidget);
      await tester.pumpAndSettle();
    });
  });

  group('ConflictResolveScreen', () {
    testWidgets('переключается в режим объединения', (tester) async {
      final conflict = _conflict();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            conflictProvider.overrideWith((ref, id) async => conflict),
          ],
          child: _app(const ConflictResolveScreen(conflictId: 'c1')),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('«Встреча с клиентом»'), findsOneWidget);
      expect(find.text('Наша версия'), findsOneWidget);

      await tester.scrollUntilVisible(
        find.text('Объединить'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(find.text('Объединить'));
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Объединить правки'),
        -300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Объединить правки'), findsOneWidget);
      await tester.scrollUntilVisible(
        find.text('Сохранить'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Сохранить'), findsOneWidget);
    });
  });

  group('AppEventTile', () {
    testWidgets('показывает точку конфликта', (tester) async {
      final start = DateTime(2026, 12, 5, 10);
      await tester.pumpWidget(
        _app(
          Scaffold(
            body: AppEventTile(
              event: CalendarEvent(
                id: 'e1',
                sourceId: 's1',
                creatorId: 'u1',
                title: 'Встреча',
                startAt: start,
                endAt: start.add(const Duration(hours: 1)),
                allDay: false,
                timezone: 'UTC',
                createdAt: '2026-12-05T09:00:00.000Z',
                updatedAt: '2026-12-05T09:00:00.000Z',
                syncStatus: 'conflict',
              ),
            ),
          ),
        ),
      );

      expect(
        find.byKey(const ValueKey('conflict-dot-e1')),
        findsOneWidget,
      );
    });
  });
}
