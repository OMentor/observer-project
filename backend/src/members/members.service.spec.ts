import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let prisma: {
    spaceMember: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    space: { findFirst: jest.Mock };
  };
  let spaces: { ensureMember: jest.Mock; getAccess: jest.Mock };
  let service: MembersService;

  beforeEach(() => {
    prisma = {
      spaceMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      space: { findFirst: jest.fn() },
    };
    spaces = { ensureMember: jest.fn(), getAccess: jest.fn() };
    service = new MembersService(prisma as never, spaces as never);
  });

  it('list требует членства и возвращает участников', async () => {
    spaces.ensureMember.mockResolvedValue({});
    prisma.spaceMember.findMany.mockResolvedValue([{ id: 'm1' }]);

    const result = await service.list('u1', 'sp1');

    expect(result).toEqual([{ id: 'm1' }]);
    expect(spaces.ensureMember).toHaveBeenCalledWith('u1', 'sp1');
  });

  it('update меняет пресет участника', async () => {
    prisma.spaceMember.findUnique.mockResolvedValue({
      id: 'm1',
      space_id: 'sp1',
      user_id: 'u2',
    });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'u1' });
    prisma.spaceMember.update.mockResolvedValue({});

    await service.update('u1', 'm1', { preset: 'READ' });

    expect(prisma.spaceMember.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { preset: 'READ' },
    });
  });

  it('update запрещён без полного доступа', async () => {
    prisma.spaceMember.findUnique.mockResolvedValue({
      id: 'm1',
      space_id: 'sp1',
      user_id: 'u2',
    });
    spaces.getAccess.mockResolvedValue({ isOwner: false, preset: 'OWN' });

    await expect(
      service.update('u1', 'm1', { preset: 'READ' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('update запрещает изменение владельца', async () => {
    prisma.spaceMember.findUnique.mockResolvedValue({
      id: 'm1',
      space_id: 'sp1',
      user_id: 'owner',
    });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });

    await expect(
      service.update('owner', 'm1', { preset: 'READ' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove выполняет мягкий кик', async () => {
    prisma.spaceMember.findUnique.mockResolvedValue({
      id: 'm1',
      space_id: 'sp1',
      user_id: 'u2',
    });
    spaces.getAccess.mockResolvedValue({ isOwner: true, preset: 'FULL' });
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'u1' });
    prisma.spaceMember.update.mockResolvedValue({});

    const result = await service.remove('u1', 'm1');

    expect(result).toEqual({ success: true });
    expect(prisma.spaceMember.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { revoked_at: expect.any(Date) },
    });
  });

  it('remove бросает NotFoundException для неизвестного участника', async () => {
    prisma.spaceMember.findUnique.mockResolvedValue(null);

    await expect(service.remove('u1', 'm1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
