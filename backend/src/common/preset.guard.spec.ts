import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PresetGuard } from './preset.guard';
import { PresetRequirement } from './require-preset.decorator';

describe('PresetGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: {
    space: { findFirst: jest.Mock };
    spaceMember: { findFirst: jest.Mock };
  };
  let guard: PresetGuard;

  const requirement: PresetRequirement = {
    presets: ['FULL', 'OWN'],
    resource: 'space',
  };

  const context = (user: { id: string } | undefined): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id: 'sp1' }, body: {} }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = {
      space: { findFirst: jest.fn() },
      spaceMember: { findFirst: jest.fn() },
    };
    guard = new PresetGuard(reflector as never, prisma as never);
  });

  it('пропускает маршруты без требования пресета', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(context({ id: 'u1' }))).resolves.toBe(true);
  });

  it('владелец проходит проверку без обращения к участникам', async () => {
    reflector.getAllAndOverride.mockReturnValue(requirement);
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'u1' });

    await expect(guard.canActivate(context({ id: 'u1' }))).resolves.toBe(true);
    expect(prisma.spaceMember.findFirst).not.toHaveBeenCalled();
  });

  it('участник с подходящим пресетом проходит', async () => {
    reflector.getAllAndOverride.mockReturnValue(requirement);
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });
    prisma.spaceMember.findFirst.mockResolvedValue({ preset: 'OWN' });

    await expect(guard.canActivate(context({ id: 'u1' }))).resolves.toBe(true);
  });

  it('участник с неподходящим пресетом получает ForbiddenException', async () => {
    reflector.getAllAndOverride.mockReturnValue(requirement);
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });
    prisma.spaceMember.findFirst.mockResolvedValue({ preset: 'BUSY' });

    await expect(guard.canActivate(context({ id: 'u1' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('чужак получает ForbiddenException', async () => {
    reflector.getAllAndOverride.mockReturnValue(requirement);
    prisma.space.findFirst.mockResolvedValue({ owner_id: 'owner' });
    prisma.spaceMember.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(context({ id: 'u1' }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
