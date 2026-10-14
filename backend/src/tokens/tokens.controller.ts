import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import {
  ActivateTokenDto,
  activateTokenSchema,
  BatchTokenDto,
  batchTokenSchema,
  CreateTokenDto,
  createTokenSchema,
} from './tokens.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RequirePreset } from '../common/require-preset.decorator';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Tokens')
@ApiBearerAuth()
@Controller()
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Post('spaces/:id/tokens')
  @RequirePreset(['FULL'], 'space')
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createTokenSchema)) dto: CreateTokenDto,
  ) {
    return this.tokens.create(user.id, id, dto);
  }

  @Get('spaces/:id/tokens')
  @RequirePreset(['FULL'], 'space')
  list(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tokens.list(user.id, id);
  }

  @Post('tokens/batch')
  @RequirePreset(['FULL'], 'space-body')
  batch(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(batchTokenSchema)) dto: BatchTokenDto,
  ) {
    return this.tokens.batch(user.id, dto);
  }

  @HttpCode(200)
  @Post('tokens/:token/activate')
  activate(
    @CurrentUser() user: AuthUser,
    @Param('token') token: string,
    @Body(new ZodValidationPipe(activateTokenSchema)) dto: ActivateTokenDto,
  ) {
    return this.tokens.activate(user.id, token, dto);
  }

  @HttpCode(200)
  @Delete('tokens/:id')
  @RequirePreset(['FULL'], 'token')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tokens.revoke(user.id, id);
  }
}
