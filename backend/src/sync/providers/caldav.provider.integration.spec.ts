import { readFileSync } from 'fs';
import { join } from 'path';
import { CaldavProvider } from './caldav.provider';

interface YandexCreds {
  login: string;
  pass: string;
}

function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }
  return env;
}

/** Креды из окружения или локального backend/.env (не коммитится). */
function loadYandexCreds(): YandexCreds | null {
  if (process.env.YANDEX_TEST_LOGIN && process.env.YANDEX_TEST_PASS) {
    return {
      login: process.env.YANDEX_TEST_LOGIN,
      pass: process.env.YANDEX_TEST_PASS,
    };
  }
  try {
    const env = parseEnv(readFileSync(join(process.cwd(), '.env'), 'utf8'));
    if (env.YANDEX_TEST_LOGIN && env.YANDEX_TEST_PASS) {
      return { login: env.YANDEX_TEST_LOGIN, pass: env.YANDEX_TEST_PASS };
    }
  } catch {
    // .env отсутствует — интеграционный тест будет пропущен.
  }
  return null;
}

const creds = loadYandexCreds();
// Реальный прогон только при наличии тестовых кред (локально).
const describeIntegration = creds ? describe : describe.skip;

describeIntegration('CaldavProvider — интеграция с Яндекс.Календарём', () => {
  jest.setTimeout(30_000);

  it('подключается и возвращает хотя бы один календарь', async () => {
    const provider = new CaldavProvider(
      {
        url: 'https://caldav.yandex.ru',
        username: creds!.login,
        password: creds!.pass,
      },
      'yandex',
    );

    const calendars = await provider.listCalendars();

    expect(calendars.length).toBeGreaterThan(0);
    expect(calendars.every((calendar) => calendar.id.startsWith('http'))).toBe(
      true,
    );
    expect(calendars.some((calendar) => calendar.name.length > 0)).toBe(true);
  });
});
