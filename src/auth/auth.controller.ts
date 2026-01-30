import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import * as Redis from 'ioredis';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private redis: Redis.Redis;

  constructor(private authService: AuthService) {
    this.redis = new Redis.Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6355', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administradora' })
  async loginAdmin(@Body() loginDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @Public()
  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token de administradora' })
  async refreshAdmin(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticação Google OAuth' })
  async googleAuth(@Req() req, @Query('invite') invite?: string) {
    // Passport redireciona automaticamente para Google
    // Se houver inviteToken, armazenar temporariamente no Redis
    if (invite) {
      const sessionId = `oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await this.redis.setex(sessionId, 300, invite); // Expira em 5 minutos
      // Armazenar sessionId em cookie
      req.res?.cookie('oauth_session', sessionId, { httpOnly: true, maxAge: 300000, sameSite: 'lax' });
    }
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const user = req.user as any;
    let inviteToken: string | undefined;
    
    // Tentar pegar inviteToken do cookie/Redis
    const sessionId = req.cookies?.oauth_session;
    if (sessionId) {
      inviteToken = (await this.redis.get(sessionId)) || undefined;
      if (inviteToken) {
        await this.redis.del(sessionId);
      }
      res.clearCookie('oauth_session');
    }
    
    // Também tentar do state (fallback)
    if (!inviteToken && req.query.state) {
      inviteToken = req.query.state as string;
    }
    
    const tokens = await this.authService.loginGoogle(user, inviteToken);
    // Redirecionar para frontend com token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (invalida token)' })
  @HttpCode(HttpStatus.OK)
  async logout() {
    // Em produção, você pode adicionar tokens a uma blacklist no Redis
    return { message: 'Logout realizado com sucesso' };
  }
}
