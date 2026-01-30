import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { InvitesService } from '../invites/invites.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let invitesService: InvitesService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockInvitesService = {
    acceptInvite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InvitesService,
          useValue: mockInvitesService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    invitesService = module.get<InvitesService>(InvitesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAdmin', () => {
    it('should return user for valid admin credentials', async () => {
      const email = 'admin@example.com';
      const password = 'password123';
      const user = { id: '1', email, role: UserRole.ADMIN, password: 'hashed' } as User;

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateAdmin(email, password);

      expect(result).toEqual(user);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(user, password);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateAdmin('invalid@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const user = { id: '1', email: 'admin@example.com', role: UserRole.ADMIN } as User;

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.validateAdmin('admin@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      const user = { id: '1', email: 'user@example.com', role: UserRole.PATIENT } as User;

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(service.validateAdmin('user@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginAdmin', () => {
    it('should return access and refresh tokens', async () => {
      const email = 'admin@example.com';
      const password = 'password123';
      const user = { id: '1', email, role: UserRole.ADMIN } as User;
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.loginAdmin({ email, password });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('loginGoogle', () => {
    it('should return tokens and accept invite if token provided', async () => {
      const user = { id: '1', email: 'google@example.com', role: UserRole.PATIENT } as User;
      const inviteToken = 'invite-token';
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      mockJwtService.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);
      mockInvitesService.acceptInvite.mockResolvedValue(undefined);

      const result = await service.loginGoogle(user, inviteToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockInvitesService.acceptInvite).toHaveBeenCalledWith(inviteToken);
    });

    it('should return tokens without accepting invite if no token provided', async () => {
      const user = { id: '1', email: 'google@example.com', role: UserRole.PATIENT } as User;
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      mockJwtService.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.loginGoogle(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockInvitesService.acceptInvite).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const refreshToken = 'validRefreshToken';
      const payload = { sub: '1', email: 'user@example.com', role: UserRole.PATIENT };
      const user = { id: '1', email: 'user@example.com', role: UserRole.PATIENT } as User;
      const newAccessToken = 'newAccessToken';

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findById.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(newAccessToken);

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken', newAccessToken);
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalidToken')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'validRefreshToken';
      const payload = { sub: '1', email: 'user@example.com', role: UserRole.PATIENT };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});

