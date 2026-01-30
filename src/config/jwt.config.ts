import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_ACCESS_SECRET || 'default-secret',
  signOptions: {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
  },
});

export const jwtRefreshConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  signOptions: {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  },
});

