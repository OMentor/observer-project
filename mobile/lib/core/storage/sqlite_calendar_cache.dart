import 'dart:convert';

import 'package:sqflite/sqflite.dart';

import '../models.dart';
import 'calendar_cache.dart';

/// Реализация [CalendarCache] поверх SQLite (sqflite).
///
/// Хранит JSON-снимки пространств и событий. Полная перезапись таблиц при
/// каждом синке — простой и надёжный способ держать кэш в актуальном виде.
class SqliteCalendarCache implements CalendarCache {
  SqliteCalendarCache({this.onLastSynced});

  /// Вызывается после сохранения отметки времени синхронизации.
  final void Function(DateTime value)? onLastSynced;

  Database? _db;

  Future<Database> _open() async {
    final existing = _db;
    if (existing != null) {
      return existing;
    }
    final dir = await getDatabasesPath();
    final db = await openDatabase(
      '$dir/pletenie_cache.db',
      version: 1,
      onCreate: (db, version) async {
        await db.execute(
          'CREATE TABLE spaces (id TEXT PRIMARY KEY, data TEXT NOT NULL)',
        );
        await db.execute(
          'CREATE TABLE events (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, '
          'start_at INTEGER NOT NULL, data TEXT NOT NULL)',
        );
        await db.execute(
          'CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
        );
      },
    );
    _db = db;
    return db;
  }

  @override
  Future<void> writeSpaces(List<Space> spaces) async {
    final db = await _open();
    await db.transaction((txn) async {
      await txn.delete('spaces');
      final batch = txn.batch();
      for (final space in spaces) {
        batch.insert('spaces', {
          'id': space.id,
          'data': jsonEncode(space.toJson()),
        });
      }
      await batch.commit(noResult: true);
    });
  }

  @override
  Future<List<Space>> readSpaces() async {
    final db = await _open();
    final rows = await db.query('spaces');
    return rows
        .map(
          (row) => Space.fromJson(
            jsonDecode(row['data'] as String) as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  @override
  Future<void> writeEvents(List<CalendarEvent> events) async {
    final db = await _open();
    await db.transaction((txn) async {
      await txn.delete('events');
      final batch = txn.batch();
      for (final event in events) {
        batch.insert('events', {
          'id': event.id,
          'source_id': event.sourceId,
          'start_at': event.startAt.millisecondsSinceEpoch,
          'data': jsonEncode(event.toJson()),
        });
      }
      await batch.commit(noResult: true);
    });
  }

  @override
  Future<List<CalendarEvent>> readEvents() async {
    final db = await _open();
    final rows = await db.query('events', orderBy: 'start_at ASC');
    return rows
        .map(
          (row) => CalendarEvent.fromJson(
            jsonDecode(row['data'] as String) as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  @override
  Future<DateTime?> readLastSyncedAt() async {
    final db = await _open();
    final rows = await db.query(
      'meta',
      where: 'key = ?',
      whereArgs: ['last_synced_at'],
      limit: 1,
    );
    if (rows.isEmpty) {
      return null;
    }
    return DateTime.tryParse(rows.first['value'] as String);
  }

  @override
  Future<void> writeLastSyncedAt(DateTime value) async {
    final db = await _open();
    await db.insert('meta', {
      'key': 'last_synced_at',
      'value': value.toUtc().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
    onLastSynced?.call(value);
  }
}
