import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ConflictResolverService } from './conflict-resolver.service';
import { ConflictsController } from './conflicts.controller';
import { ListConflictsDto } from './dto/list-conflicts.query';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

const query: ListConflictsDto = { limit: 50, offset: 0 };

function build(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const resolver = {
    list: jest.fn().mockResolvedValue({ items: [], limit: 50, offset: 0 }),
    get: jest.fn().mockResolvedValue({ id: 'conf1' }),
    resolve: jest.fn().mockResolvedValue({ id: 'ev1', sync_status: 'synced' }),
    ...overrides,
  };
  const controller = new ConflictsController(
    resolver as unknown as ConflictResolverService,
  );
  return { controller, resolver };
}

describe('ConflictsController', () => {
  it('list делегирует в сервис с userId и фильтрами', async () => {
    const { controller, resolver } = build();

    const result = await controller.list({ id: 'user1' } as never, query);

    expect(resolver.list).toHaveBeenCalledWith('user1', query);
    expect(result).toEqual({ items: [], limit: 50, offset: 0 });
  });

  it('get делегирует в сервис', async () => {
    const { controller, resolver } = build();

    const result = await controller.get({ id: 'user1' } as never, 'conf1');

    expect(resolver.get).toHaveBeenCalledWith('user1', 'conf1');
    expect(result).toEqual({ id: 'conf1' });
  });

  it('resolve делегирует в сервис и возвращает обновлённое событие', async () => {
    const { controller, resolver } = build();
    const dto: ResolveConflictDto = { resolution: 'local' };

    const result = await controller.resolve(
      { id: 'user1' } as never,
      'conf1',
      dto,
    );

    expect(resolver.resolve).toHaveBeenCalledWith('user1', 'conf1', dto);
    expect(result).toEqual({ id: 'ev1', sync_status: 'synced' });
  });

  it('resolve пробрасывает 403 для чужого конфликта', async () => {
    const { controller } = build({
      resolve: jest.fn().mockRejectedValue(new ForbiddenException()),
    });

    await expect(
      controller.resolve({ id: 'user1' } as never, 'conf1', {
        resolution: 'local',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resolve пробрасывает 409 для уже разрешённого конфликта', async () => {
    const { controller } = build({
      resolve: jest.fn().mockRejectedValue(new ConflictException()),
    });

    await expect(
      controller.resolve({ id: 'user1' } as never, 'conf1', {
        resolution: 'external',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
