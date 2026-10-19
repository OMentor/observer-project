import { CaldavProvider, DavClientFactory } from './caldav.provider';
import { ProviderCredentials } from './sync-provider.interface';

const credentials: ProviderCredentials = {
  url: 'http://localhost:5232',
  username: 'dev',
  password: 'dev',
};

describe('CaldavProvider', () => {
  it('listCalendars возвращает id (url) и имя календарей', async () => {
    const factory: DavClientFactory = jest.fn().mockResolvedValue({
      fetchCalendars: jest.fn().mockResolvedValue([
        { url: 'http://localhost:5232/dev/personal/', displayName: 'Личный' },
        { url: 'http://localhost:5232/dev/work/' },
      ]),
    });
    const provider = new CaldavProvider(credentials, 'yandex', factory);

    const calendars = await provider.listCalendars();

    expect(calendars).toEqual([
      { id: 'http://localhost:5232/dev/personal/', name: 'Личный' },
      { id: 'http://localhost:5232/dev/work/', name: '' },
    ]);
    expect(factory).toHaveBeenCalledWith(credentials);
  });

  it('pull/push/delete ещё не реализованы (Фазы 2/3)', async () => {
    const provider = new CaldavProvider(credentials, 'mailru', jest.fn());

    await expect(provider.pull()).rejects.toThrow(
      'Not implemented yet (Phase 2)',
    );
    await expect(provider.push({ id: 'x' })).rejects.toThrow(
      'Not implemented yet (Phase 3)',
    );
    await expect(provider.delete('x')).rejects.toThrow(
      'Not implemented yet (Phase 3)',
    );
  });
});
