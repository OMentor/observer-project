import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SpacesService } from './spaces.service';

describe('SpacesService', () => {
  let prisma: {
    space: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    spaceMember: { findFirst: jest.Mock };
  };
  let service: SpacesService;

  beforeEach(() => {
    prisma = {
      space: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      spaceMember: { findFirst: jest.fn() },
    };
    service = new SpacesService(prisma as never);
  });

  it('создаёт пространство с владельцем-участником FULL', async () => {
    prisma.space.create.mockResolvedValue({ id: 's1' });

    await service.create('u1', { name: 'Личное' });

    expect(prisma.space.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Личное',
          owner_id: 'u1',
          members: { create: { user_id: 'u1', preset: 'FULL' } },
        }),
      }),
    );
  });

  it('ensureMember бросает NotFoundException, если пространства нет', async () => {
    prisma.space.findFirst.mockResolvedValue(null);

    await expect(service.ensureMember('u1', 's1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('ensureMember бросает ForbiddenException для чужака', async () => {
    prisma.space.findFirst.mockResolvedValue({ id: 's1', owner_id: 'owner' });
    prisma.spaceMember.findFirst.mockResolvedValue(null);

    await expect(service.ensureMember('u1', 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('ensureOwner бросает ForbiddenException для не-владельца', async () => {
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });

    await expect(service.ensureOwner('u1', 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('remove выполняет мягкое удаление', async () => {
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'u1' });
    prisma.space.update.mockResolvedValue({});

    await service.remove('u1', 's1');

    expect(prisma.space.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { deleted_at: expect.any(Date) },
    });
  });
});
