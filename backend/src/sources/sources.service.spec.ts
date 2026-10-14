import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SourcesService } from './sources.service';

describe('SourcesService', () => {
  let prisma: {
    source: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let spaces: { ensureMember: jest.Mock };
  let service: SourcesService;

  beforeEach(() => {
    prisma = {
      source: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    spaces = { ensureMember: jest.fn() };
    service = new SourcesService(prisma as never, spaces as never);
  });

  it('создаёт источник с владельцем и цветом по умолчанию', async () => {
    spaces.ensureMember.mockResolvedValue({});
    prisma.source.create.mockResolvedValue({ id: 'src1' });

    await service.create('u1', 'sp1', { name: 'Мой календарь' });

    expect(prisma.source.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          space_id: 'sp1',
          owner_id: 'u1',
          name: 'Мой календарь',
          color: '#5B5FEF',
          visibility: 'SHARED',
        }),
      }),
    );
  });

  it('findAll для не-FULL участника фильтрует приватные источники', async () => {
    spaces.ensureMember.mockResolvedValue({
      space: { owner_id: 'owner' },
      member: { preset: 'READ' },
    });
    prisma.source.findMany.mockResolvedValue([]);

    await service.findAll('u1', 'sp1');

    expect(prisma.source.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ visibility: 'SHARED' }, { owner_id: 'u1' }],
        }),
      }),
    );
  });

  it('update бросает ForbiddenException для чужого источника', async () => {
    spaces.ensureMember.mockResolvedValue({});
    prisma.source.findFirst.mockResolvedValue({
      id: 'src1',
      owner_id: 'other',
      space_id: 'sp1',
    });

    await expect(
      service.update('u1', 'src1', { name: 'X' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findOne бросает NotFoundException для удалённого источника', async () => {
    prisma.source.findFirst.mockResolvedValue(null);

    await expect(service.findOne('u1', 'src1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
