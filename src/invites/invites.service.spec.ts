import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { Invite, InviteStatus } from './entities/invite.entity';

describe('InvitesService', () => {
  let service: InvitesService;
  let repository: Repository<Invite>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesService,
        {
          provide: getRepositoryToken(Invite),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvitesService>(InvitesService);
    repository = module.get<Repository<Invite>>(getRepositoryToken(Invite));
    
    // Mock transporter
    (service as any).transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new invite', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const invite = {
        id: '1',
        email,
        name,
        token: 'token123',
        status: InviteStatus.PENDING,
        expiresAt: new Date(),
      } as Invite;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(invite);
      mockRepository.save.mockResolvedValue(invite);
      mockTransporter.sendMail.mockResolvedValue(undefined);

      const result = await service.create(email, name);

      expect(result).toEqual(invite);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if pending invite exists', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const existingInvite = {
        id: '1',
        email,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000), // Future date
      } as Invite;

      mockRepository.findOne.mockResolvedValue(existingInvite);

      await expect(service.create(email, name)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByToken', () => {
    it('should return invite for valid token', async () => {
      const token = 'valid-token';
      const invite = {
        id: '1',
        token,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);

      const result = await service.findByToken(token);

      expect(result).toEqual(invite);
    });

    it('should throw NotFoundException for invalid token', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired invite', async () => {
      const token = 'expired-token';
      const invite = {
        id: '1',
        token,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000), // Past date
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);
      mockRepository.save.mockResolvedValue({ ...invite, status: InviteStatus.EXPIRED });

      await expect(service.findByToken(token)).rejects.toThrow(BadRequestException);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      const token = 'used-token';
      const invite = {
        id: '1',
        token,
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() + 86400000),
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);

      await expect(service.findByToken(token)).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvite', () => {
    it('should accept a valid invite', async () => {
      const token = 'valid-token';
      const invite = {
        id: '1',
        token,
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000),
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);
      mockRepository.save.mockResolvedValue({ ...invite, status: InviteStatus.ACCEPTED });

      await service.acceptInvite(token);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: InviteStatus.ACCEPTED }),
      );
    });
  });

  describe('remove', () => {
    it('should remove a pending invite', async () => {
      const id = '1';
      const invite = {
        id,
        status: InviteStatus.PENDING,
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException when removing accepted invite', async () => {
      const id = '1';
      const invite = {
        id,
        status: InviteStatus.ACCEPTED,
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);

      await expect(service.remove(id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resend', () => {
    it('should resend a pending invite', async () => {
      const id = '1';
      const invite = {
        id,
        email: 'test@example.com',
        name: 'Test User',
        status: InviteStatus.PENDING,
        expiresAt: new Date(),
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);
      mockRepository.save.mockResolvedValue(invite);
      mockTransporter.sendMail.mockResolvedValue(undefined);

      const result = await service.resend(id);

      expect(result).toEqual(invite);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      const id = '1';
      const invite = {
        id,
        status: InviteStatus.ACCEPTED,
      } as Invite;

      mockRepository.findOne.mockResolvedValue(invite);

      await expect(service.resend(id)).rejects.toThrow(BadRequestException);
    });
  });
});

