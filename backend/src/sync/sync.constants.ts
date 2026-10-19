/** Имя очереди BullMQ для задач синхронизации. */
export const SYNC_QUEUE = 'sync';

/** Полезная нагрузка задачи синхронизации. */
export interface SyncJobData {
  /** Pull: синхронизировать конкретную связь источника. */
  sourceMapId?: string;
  /** Push: выгрузить конкретное событие во внешний календарь. */
  pushEventId?: string;
}
