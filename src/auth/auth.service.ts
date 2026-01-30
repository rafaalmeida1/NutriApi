import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { InvitesService } from '../invites/invites.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private invitesService: InvitesService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.role !== 'admin') {
      throw new UnauthorizedException('Acesso negado');
    }

    return user;
  }

  async loginAdmin(loginDto: LoginAdminDto) {
    const user = await this.validateAdmin(loginDto.email, loginDto.password);
    return this.generateTokens(user);
  }

  async loginGoogle(user: User, inviteToken?: string) {
    // Se houver token de convite, aceitar o convite
    if (inviteToken) {
      try {
        await this.invitesService.acceptInvite(inviteToken);
      } catch (error) {
        // Se o convite for inválido, ainda permite o login
        console.error('Erro ao aceitar convite:', error);
      }
    }
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return this.generateAccessToken(user);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      } as any),
    };
  }

  private generateAccessToken(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

