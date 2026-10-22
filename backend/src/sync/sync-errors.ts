/**
 * Конфликт версий при push во внешний календарь (HTTP 412 Precondition Failed
 * либо внешнее событие было удалено). Обрабатывается `PushService` созданием
 * записи `SyncConflict` без повтора задачи.
 */
export class SyncConflictError extends Error {
  constructor(message = 'Конфликт версий с внешним календарём') {
    super(message);
    this.name = 'SyncConflictError';
  }
}
