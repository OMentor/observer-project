import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncQueueService } from './queue/sync-queue.service';
import { SyncController } from './sync.controller';

function build(maps: Array<{ id: string }>, connection: unknown = { id: 'c1' }) {
  const prisma = {
    externalConnection: { findFirst: jest.fn().mockResolvedValue(connection) },
    sourceExternalMap: { findMany: jest.fn().mockResolvedValue(maps) },
  };
  const queue = { enqueuePull: jest.fn().mockResolvedValue(undefined) };
  const controller = new SyncController(
    prisma as unknown as PrismaService,
    queue as unknown as SyncQueueService,
  );
  return { controller, prisma, queue };
}

describe('SyncController', () => {
  it('ставит в очередь все связи подключения', async () => {
    const { controller, queue } = build([{ id: 'm1' }, { id: 'm2' }]);

    const result = await controller.force({ id: 'user1' } as never, 'c1');

    expect(result).toEqual({ queued: 2 });
    expect(queue.enqueuePull).toHaveBeenCalledTimes(2);
    expect(queue.enqueuePull).toHaveBeenCalledWith('m1');
    expect(queue.enqueuePull).toHaveBeenCalledWith('m2');
  });

  it('бросает NotFound для чужого подключения', async () => {
    const { controller } = build([], null);

    await expect(
      controller.force({ id: 'user1' } as never, 'c1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
