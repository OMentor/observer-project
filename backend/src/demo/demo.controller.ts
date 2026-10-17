import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DemoService } from './demo.service';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Demo')
@ApiBearerAuth()
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('seed')
  @HttpCode(200)
  seed(@CurrentUser() user: AuthUser) {
    return this.demo.seed(user.id);
  }
}
