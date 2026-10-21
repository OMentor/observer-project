import axios from 'axios';

/**
 * Ошибка сети: запрос не дошёл до сервера (нет ответа).
 * Используется для перевода индикатора синхронизации в состояние ошибки.
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/** HTTP-статус ответа ошибки (если он есть). */
export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
