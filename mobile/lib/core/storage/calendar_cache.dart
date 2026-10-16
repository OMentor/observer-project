import '../models.dart';

/// Локальное (SQLite) хранилище для оффлайн-режима: кэш пространств,
/// событий и отметки последней успешной синхронизации.
abstract class CalendarCache {
  Future<List<Space>> readSpaces();

  Future<void> writeSpaces(List<Space> spaces);

  Future<List<CalendarEvent>> readEvents();

  Future<void> writeEvents(List<CalendarEvent> events);

  Future<DateTime?> readLastSyncedAt();

  Future<void> writeLastSyncedAt(DateTime value);
}
