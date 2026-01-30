import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('PatientsService', () => {
  let service: PatientsService;
  let usersService: UsersService;

  const mockUsersService = {
    findPatients: jest.fn(),
    findById: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all patients', async () => {
      const patients = [
        { id: '1', email: 'patient1@example.com', role: UserRole.PATIENT },
        { id: '2', email: 'patient2@example.com', role: UserRole.PATIENT },
      ] as User[];

      mockUsersService.findPatients.mockResolvedValue(patients);

      const result = await service.findAll();

      expect(result).toEqual(patients);
      expect(mockUsersService.findPatients).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a patient by id', async () => {
      const id = '1';
      const patient = { id, email: 'patient@example.com', role: UserRole.PATIENT } as User;

      mockUsersService.findById.mockResolvedValue(patient);

      const result = await service.findOne(id);

      expect(result).toEqual(patient);
    });

    it('should throw NotFoundException if patient not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is not a patient', async () => {
      const admin = { id: '1', email: 'admin@example.com', role: UserRole.ADMIN } as User;

      mockUsersService.findById.mockResolvedValue(admin);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a patient', async () => {
      const id = '1';
      const patient = { id, email: 'patient@example.com', role: UserRole.PATIENT } as User;

      mockUsersService.findById.mockResolvedValue(patient);
      mockUsersService.remove.mockResolvedValue(undefined);

      await service.remove(id);

      expect(mockUsersService.remove).toHaveBeenCalledWith(id);
    });
  });
});

