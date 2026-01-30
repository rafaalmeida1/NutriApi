import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = { id: '1', email, role: UserRole.PATIENT } as User;

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const id = '1';
      const user = { id, email: 'test@example.com', role: UserRole.PATIENT } as User;

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(id);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
    });
  });

  describe('createAdmin', () => {
    it('should create an admin user with hashed password', async () => {
      const email = 'admin@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const user = { id: '1', email, password: hashedPassword, role: UserRole.ADMIN } as User;

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.createAdmin(email, password);

      expect(result).toEqual(user);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('createOrUpdateFromGoogle', () => {
    it('should create a new user from Google', async () => {
      const email = 'google@example.com';
      const googleId = 'google123';
      const name = 'John Doe';
      const user = { id: '1', email, googleId, role: UserRole.PATIENT } as User;

      mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.createOrUpdateFromGoogle(email, googleId, name);

      expect(result).toEqual(user);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update existing user with Google ID', async () => {
      const email = 'existing@example.com';
      const googleId = 'google123';
      const existingUser = { id: '1', email, role: UserRole.PATIENT } as User;
      const updatedUser = { ...existingUser, googleId } as User;

      mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.createOrUpdateFromGoogle(email, googleId);

      expect(result.googleId).toBe(googleId);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashedPassword' } as User;
      const password = 'password123';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validatePassword(user, password);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should return false for invalid password', async () => {
      const user = { id: '1', email: 'test@example.com', password: 'hashedPassword' } as User;
      const password = 'wrongPassword';

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validatePassword(user, password);

      expect(result).toBe(false);
    });

    it('should return false if user has no password', async () => {
      const user = { id: '1', email: 'test@example.com' } as User;

      const result = await service.validatePassword(user, 'password');

      expect(result).toBe(false);
    });
  });

  describe('findPatients', () => {
    it('should return all patients', async () => {
      const patients = [
        { id: '1', email: 'patient1@example.com', role: UserRole.PATIENT },
        { id: '2', email: 'patient2@example.com', role: UserRole.PATIENT },
      ] as User[];

      mockRepository.find.mockResolvedValue(patients);

      const result = await service.findPatients();

      expect(result).toEqual(patients);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { role: UserRole.PATIENT } });
    });
  });
});

