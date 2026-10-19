import { PrismaService } from '../../prisma/prisma.service';
import { SpacesService } from '../../spaces/spaces.service';
import { PullService } from '../pull/pull.service';
import { LinksService } from './links.service';

const dto = {
  connectionId: '11111111-1111-1111-1111-111111111111',
  externalCalendarId: 'http://localhost:5232/dev/personal/',
  externalCalendarName: 'Личный',
};

const createdMap = {
  id: 'map1',
  source_id: 'src1',
  external_connection_id: dto.connectionId,
  external_calendar_id: dto.externalCalendarId,
  external_calendar_name: 'Личный',
  sync_direction: 'both',
};

function build(overrides: {
  source?: unknown;
  connection?: unknown;
  existingMap?: unknown;
  calendarMap?: unknown;
  preset?: string;
}) {
  const prisma = {
    source: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          overrides.source === undefined
            ? { id: 'src1', space_id: 'space1' }
            : overrides.source,
        ),
    },
    externalConnection: {
      findFirst: jest
        .fn()
        .mockResolvedValue(
          overrides.connection === undefined
            ? { id: dto.connectionId, user_id: 'user1' }
            : overrides.connection,
        ),
    },
    sourceExternalMap: {
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(overrides.existingMap ?? null)
        .mockResolvedValueOnce(overrides.calendarMap ?? null),
      create: jest.fn().mockResolvedValue(createdMap),
      delete: jest.fn().mockResolvedValue(createdMap),
    },
  };
  const spaces = {
    getAccess: jest
      .fn()
      .mockResolvedValue({ isOwner: true, preset: overrides.preset ?? 'FULL' }),
  };
  const pull = {
    pullSourceMap: jest
      .fn()
      .mockResolvedValue({ created: 2, updated: 0, deleted: 0, skipped: 0 }),
  };
  const service = new LinksService(
    prisma as unknown as PrismaService,
    spaces as unknown as SpacesService,
    pull as unknown as PullService,
  );
  return { service, prisma, spaces, pull };
}

describe('LinksService', () => {
  it('создаёт связь и запускает первичный pull', async () => {
    const { service, prisma, pull } = build({});

    const result = await service.link('user1', 'src1', dto);

    expect(prisma.sourceExternalMap.create).toHaveBeenCalledWith({
      data: {
        source_id: 'src1',
        external_connection_id: dto.connectionId,
        external_calendar_id: dto.externalCalendarId,
        external_calendar_name: 'Личный',
        sync_direction: 'both',
      },
    });
    expect(pull.pullSourceMap).toHaveBeenCalledWith('map1');
    expect(result).toMatchObject({
      id: 'map1',
      source_id: 'src1',
      stats: { created: 2 },
    });
  });

  it('отклоняет, если источник уже связан', async () => {
    const { service } = build({ existingMap: { id: 'old' } });

    await expect(service.link('user1', 'src1', dto)).rejects.toThrow(
      'Источник уже связан с календарём',
    );
  });

  it('отклоняет, если календарь уже связан с другим источником', async () => {
    const { service } = build({ calendarMap: { id: 'other' } });

    await expect(service.link('user1', 'src1', dto)).rejects.toThrow(
      'Этот календарь уже связан с другим источником',
    );
  });

  it('отклоняет без доступа FULL', async () => {
    const { service } = build({ preset: 'READ' });

    await expect(service.link('user1', 'src1', dto)).rejects.toThrow(
      'Недостаточно прав для связывания источника',
    );
  });

  it('отклоняет, если подключение не принадлежит пользователю', async () => {
    const { service } = build({ connection: null });

    await expect(service.link('user1', 'src1', dto)).rejects.toThrow(
      'Подключение не найдено',
    );
  });

  it('удаляет связь источника', async () => {
    const { service, prisma } = build({
      existingMap: { id: 'map1', external_connection_id: dto.connectionId },
    });
    prisma.sourceExternalMap.findFirst.mockReset();
    prisma.sourceExternalMap.findFirst.mockResolvedValue({
      id: 'map1',
      external_connection_id: dto.connectionId,
    });

    const result = await service.unlink('user1', 'src1');

    expect(prisma.sourceExternalMap.delete).toHaveBeenCalledWith({
      where: { id: 'map1' },
    });
    expect(result).toEqual({ success: true });
  });

  it('бросает NotFound при отсутствии связи', async () => {
    const { service, prisma } = build({});
    prisma.sourceExternalMap.findFirst.mockReset();
    prisma.sourceExternalMap.findFirst.mockResolvedValue(null);

    await expect(service.unlink('user1', 'src1')).rejects.toThrow(
      'Связь с календарём не найдена',
    );
  });
});
