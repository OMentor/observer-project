import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { LinkSourceDto } from './links.dto';

describe('LinksController', () => {
  const dto: LinkSourceDto = {
    connectionId: '11111111-1111-1111-1111-111111111111',
    externalCalendarId: 'http://localhost:5232/dev/personal/',
  };

  it('link делегирует в сервис', async () => {
    const links = {
      link: jest.fn().mockResolvedValue({ id: 'map1' }),
      unlink: jest.fn(),
    };
    const controller = new LinksController(links as unknown as LinksService);

    const result = await controller.link({ id: 'user1' } as never, 'src1', dto);

    expect(links.link).toHaveBeenCalledWith('user1', 'src1', dto);
    expect(result).toEqual({ id: 'map1' });
  });

  it('unlink делегирует в сервис', async () => {
    const links = {
      link: jest.fn(),
      unlink: jest.fn().mockResolvedValue({ success: true }),
    };
    const controller = new LinksController(links as unknown as LinksService);

    const result = await controller.unlink({ id: 'user1' } as never, 'src1');

    expect(links.unlink).toHaveBeenCalledWith('user1', 'src1');
    expect(result).toEqual({ success: true });
  });
});
