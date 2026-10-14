import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  loginSchema,
  RefreshDto,
  refreshSchema,
  RegisterDto,
  registerSchema,
} from './auth.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { Public } from '../common/public.decorator';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('logout')
  logout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto,
  ) {
    return this.auth.logout(user.id, dto.refreshToken);
  }
}
