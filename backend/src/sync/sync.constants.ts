/** Имя очереди BullMQ для задач синхронизации. */
export const SYNC_QUEUE = 'sync';

/** Полезная нагрузка задачи синхронизации. */
export interface SyncJobData {
  /** Синхронизировать конкретную связь источника. */
  sourceMapId?: string;
  /** Синхронизировать все связи подключения. */
  connectionId?: string;
}
