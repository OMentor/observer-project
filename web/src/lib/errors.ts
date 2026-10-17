import axios from 'axios';

/**
 * Ошибка сети: запрос не дошёл до сервера (нет ответа).
 * Используется для перевода индикатора синхронизации в состояние ошибки.
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
