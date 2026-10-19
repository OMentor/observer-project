import { CaldavProvider, DavClient, DavClientFactory } from './caldav.provider';
import { ProviderCredentials } from './sync-provider.interface';

const credentials: ProviderCredentials = {
  url: 'http://localhost:5232',
  username: 'dev',
  password: 'dev',
};

const CALENDAR_URL = 'http://localhost:5232/dev/personal/';

function ics(uid: string, summary: string): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pletenie//Test//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    'DTSTAMP:20261015T090000Z',
    'DTSTART:20261020T100000Z',
    'DTEND:20261020T110000Z',
    `SUMMARY:${summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function davClient(overrides: Partial<DavClient> = {}): DavClient {
  return {
    fetchCalendars: jest.fn().mockResolvedValue([]),
    fetchCalendarObjects: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function factoryReturning(client: DavClient): DavClientFactory {
  return jest.fn().mockResolvedValue(client);
}

describe('CaldavProvider', () => {
  it('listCalendars возвращает id (url) и имя календарей', async () => {
    const factory = factoryReturning(
      davClient({
        fetchCalendars: jest.fn().mockResolvedValue([
          { url: CALENDAR_URL, displayName: 'Личный' },
          { url: 'http://localhost:5232/dev/work/' },
        ]),
      }),
    );
    const provider = new CaldavProvider(credentials, 'yandex', factory);

    const calendars = await provider.listCalendars();

    expect(calendars).toEqual([
      { id: CALENDAR_URL, name: 'Личный' },
      { id: 'http://localhost:5232/dev/work/', name: '' },
    ]);
    expect(factory).toHaveBeenCalledWith(credentials);
  });

  it('pull возвращает события с uid, etag и ics', async () => {
    const fetchCalendarObjects = jest.fn().mockResolvedValue([
      { url: `${CALENDAR_URL}a.ics`, etag: 'etag-a', data: ics('a', 'A') },
      { url: `${CALENDAR_URL}b.ics`, etag: 'etag-b', data: ics('b', 'B') },
      // объект без данных (метаданные) — пропускается
      { url: `${CALENDAR_URL}meta.ics`, etag: 'x' },
    ]);
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(davClient({ fetchCalendarObjects })),
    );

    const result = await provider.pull(CALENDAR_URL);

    expect(fetchCalendarObjects).toHaveBeenCalledWith(CALENDAR_URL);
    expect(result.events).toEqual([
      { uid: 'a', etag: 'etag-a', ical: ics('a', 'A') },
      { uid: 'b', etag: 'etag-b', ical: ics('b', 'B') },
    ]);
  });

  it('pull подставляет null вместо отсутствующего etag', async () => {
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({
          fetchCalendarObjects: jest
            .fn()
            .mockResolvedValue([
              { url: `${CALENDAR_URL}a.ics`, data: ics('a', 'A') },
            ]),
        }),
      ),
    );

    const result = await provider.pull(CALENDAR_URL);

    expect(result.events[0].etag).toBeNull();
  });

  it('push/delete ещё не реализованы (Фаза 3)', async () => {
    const provider = new CaldavProvider(credentials, 'mailru', jest.fn());

    await expect(
      provider.push({ uid: 'x', etag: null, ical: '' }),
    ).rejects.toThrow('Not implemented yet (Phase 3)');
    await expect(provider.delete(CALENDAR_URL, 'x')).rejects.toThrow(
      'Not implemented yet (Phase 3)',
    );
  });
});
