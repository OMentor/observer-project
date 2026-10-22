import { SyncConflictError } from '../sync-errors';
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

function resp(status: number, etag?: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `${status}`,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'etag' ? (etag ?? null) : null,
    },
  } as unknown as Response;
}

function davClient(overrides: Partial<DavClient> = {}): DavClient {
  return {
    fetchCalendars: jest.fn().mockResolvedValue([]),
    fetchCalendarObjects: jest.fn().mockResolvedValue([]),
    createCalendarObject: jest.fn().mockResolvedValue(resp(201)),
    updateCalendarObject: jest.fn().mockResolvedValue(resp(204)),
    deleteCalendarObject: jest.fn().mockResolvedValue(resp(204)),
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

  it('push создаёт новое событие (etag null) как UID.ics и читает ETag из ответа', async () => {
    const createCalendarObject = jest
      .fn()
      .mockResolvedValue(resp(201, '"new-etag"'));
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(davClient({ createCalendarObject })),
    );

    const result = await provider.push(CALENDAR_URL, {
      uid: 'a',
      etag: null,
      ical: ics('a', 'A'),
    });

    expect(createCalendarObject).toHaveBeenCalledWith(
      CALENDAR_URL,
      'a.ics',
      ics('a', 'A'),
    );
    expect(result).toEqual({ uid: 'a', etag: '"new-etag"', ical: ics('a', 'A') });
  });

  it('push обновляет существующее событие (etag задан) с If-Match', async () => {
    const fetchCalendarObjects = jest
      .fn()
      .mockResolvedValue([
        { url: `${CALENDAR_URL}a.ics`, etag: '"old"', data: ics('a', 'A') },
      ]);
    const updateCalendarObject = jest
      .fn()
      .mockResolvedValue(resp(204, '"updated"'));
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({ fetchCalendarObjects, updateCalendarObject }),
      ),
    );

    const result = await provider.push(CALENDAR_URL, {
      uid: 'a',
      etag: '"old"',
      ical: ics('a', 'A2'),
    });

    expect(updateCalendarObject).toHaveBeenCalledWith(
      `${CALENDAR_URL}a.ics`,
      '"old"',
      ics('a', 'A2'),
    );
    expect(result.etag).toBe('"updated"');
  });

  it('push перечитывает ETag, если сервер не вернул заголовок', async () => {
    const createCalendarObject = jest.fn().mockResolvedValue(resp(201));
    const fetchCalendarObjects = jest
      .fn()
      .mockResolvedValue([
        { url: `${CALENDAR_URL}a.ics`, etag: '"fetched"', data: ics('a', 'A') },
      ]);
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({ createCalendarObject, fetchCalendarObjects }),
      ),
    );

    const result = await provider.push(CALENDAR_URL, {
      uid: 'a',
      etag: null,
      ical: ics('a', 'A'),
    });

    expect(result.etag).toBe('"fetched"');
  });

  it('push при 412 бросает SyncConflictError', async () => {
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({ createCalendarObject: jest.fn().mockResolvedValue(resp(412)) }),
      ),
    );

    await expect(
      provider.push(CALENDAR_URL, { uid: 'a', etag: null, ical: ics('a', 'A') }),
    ).rejects.toBeInstanceOf(SyncConflictError);
  });

  it('push при отсутствии объекта во внешнем календаре бросает SyncConflictError', async () => {
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({ fetchCalendarObjects: jest.fn().mockResolvedValue([]) }),
      ),
    );

    await expect(
      provider.push(CALENDAR_URL, {
        uid: 'gone',
        etag: '"x"',
        ical: ics('gone', 'G'),
      }),
    ).rejects.toBeInstanceOf(SyncConflictError);
  });

  it('delete удаляет объект по UID', async () => {
    const fetchCalendarObjects = jest
      .fn()
      .mockResolvedValue([
        { url: `${CALENDAR_URL}a.ics`, etag: '"old"', data: ics('a', 'A') },
      ]);
    const deleteCalendarObject = jest.fn().mockResolvedValue(resp(204));
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({ fetchCalendarObjects, deleteCalendarObject }),
      ),
    );

    await provider.delete(CALENDAR_URL, 'a');

    expect(deleteCalendarObject).toHaveBeenCalledWith(`${CALENDAR_URL}a.ics`);
  });

  it('delete игнорирует отсутствие объекта', async () => {
    const deleteCalendarObject = jest.fn();
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({
          fetchCalendarObjects: jest.fn().mockResolvedValue([]),
          deleteCalendarObject,
        }),
      ),
    );

    await provider.delete(CALENDAR_URL, 'missing');

    expect(deleteCalendarObject).not.toHaveBeenCalled();
  });

  it('forcePush перезаписывает существующий объект без If-Match (etag = null)', async () => {
    const fetchCalendarObjects = jest
      .fn()
      .mockResolvedValue([
        { url: `${CALENDAR_URL}a.ics`, etag: '"old"', data: ics('a', 'A') },
      ]);
    const updateCalendarObject = jest
      .fn()
      .mockResolvedValue(resp(204, '"forced"'));
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(davClient({ fetchCalendarObjects, updateCalendarObject })),
    );

    const result = await provider.forcePush(CALENDAR_URL, {
      uid: 'a',
      etag: '"old"',
      ical: ics('a', 'A2'),
    });

    expect(updateCalendarObject).toHaveBeenCalledWith(
      `${CALENDAR_URL}a.ics`,
      null,
      ics('a', 'A2'),
    );
    expect(result.etag).toBe('"forced"');
  });

  it('forcePush создаёт объект, если он отсутствует во внешнем календаре', async () => {
    const createCalendarObject = jest
      .fn()
      .mockResolvedValue(resp(201, '"made"'));
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({
          fetchCalendarObjects: jest.fn().mockResolvedValue([]),
          createCalendarObject,
        }),
      ),
    );

    const result = await provider.forcePush(CALENDAR_URL, {
      uid: 'a',
      etag: '"old"',
      ical: ics('a', 'A'),
    });

    expect(createCalendarObject).toHaveBeenCalledWith(
      CALENDAR_URL,
      'a.ics',
      ics('a', 'A'),
    );
    expect(result.etag).toBe('"made"');
  });

  it('forcePush при 412 бросает SyncConflictError', async () => {
    const provider = new CaldavProvider(
      credentials,
      'yandex',
      factoryReturning(
        davClient({
          fetchCalendarObjects: jest.fn().mockResolvedValue([
            { url: `${CALENDAR_URL}a.ics`, etag: '"old"', data: ics('a', 'A') },
          ]),
          updateCalendarObject: jest.fn().mockResolvedValue(resp(412)),
        }),
      ),
    );

    await expect(
      provider.forcePush(CALENDAR_URL, {
        uid: 'a',
        etag: '"old"',
        ical: ics('a', 'A2'),
      }),
    ).rejects.toBeInstanceOf(SyncConflictError);
  });
});
