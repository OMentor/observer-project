import { AuthUser } from '../../common/current-user.decorator';
import { ConnectionsController } from './connections.controller';
import { CreateConnectionDto } from './connections.dto';

describe('ConnectionsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new ConnectionsController(service as never);
  const user: AuthUser = { id: 'u1', email: 'demo@pletenie.local', role: 'USER' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create делегирует в сервис', async () => {
    service.create.mockResolvedValue({ id: 'conn1' });
    const dto: CreateConnectionDto = {
      provider: 'yandex',
      url: 'http://localhost:5232',
      username: 'dev',
      password: 'secret',
    };

    await expect(controller.create(user, dto)).resolves.toEqual({
      id: 'conn1',
    });
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('findAll делегирует в сервис', async () => {
    service.findAll.mockResolvedValue([]);

    await expect(controller.findAll(user)).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith('u1');
  });

  it('remove делегирует в сервис', async () => {
    service.remove.mockResolvedValue({ success: true });

    await expect(controller.remove(user, 'conn1')).resolves.toEqual({
      success: true,
    });
    expect(service.remove).toHaveBeenCalledWith('u1', 'conn1');
  });
});
