import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EbooksService } from './ebooks.service';
import { Ebook } from './entities/ebook.entity';

describe('EbooksService', () => {
  let service: EbooksService;
  let repository: Repository<Ebook>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockMinioClient = {
    presignedGetObject: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EbooksService,
        {
          provide: getRepositoryToken(Ebook),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EbooksService>(EbooksService);
    repository = module.get<Repository<Ebook>>(getRepositoryToken(Ebook));
    
    // Mock MinIO client
    (service as any).minioClient = mockMinioClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ebook', async () => {
      const createDto = {
        title: 'Test Ebook',
        description: 'Test Description',
        coverUrl: 'https://example.com/cover.jpg',
        pdfUrl: 'https://example.com/book.pdf',
      };

      const ebook = { id: '1', ...createDto, published: false } as Ebook;

      mockRepository.create.mockReturnValue(ebook);
      mockRepository.save.mockResolvedValue(ebook);

      const result = await service.create(createDto);

      expect(result).toEqual(ebook);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all ebooks', async () => {
      const ebooks = [
        { id: '1', title: 'Ebook 1', published: true },
        { id: '2', title: 'Ebook 2', published: false },
      ] as Ebook[];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(ebooks);

      const result = await service.findAll();

      expect(result).toEqual(ebooks);
    });

    it('should filter published only', async () => {
      const ebooks = [
        { id: '1', title: 'Published Ebook', published: true },
      ] as Ebook[];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(ebooks);

      const result = await service.findAll(true);

      expect(result).toEqual(ebooks);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ebook.published = :published', {
        published: true,
      });
    });
  });

  describe('getSignedPdfUrl', () => {
    it('should return signed PDF URL', async () => {
      const id = '1';
      const ebook = {
        id,
        title: 'Test Ebook',
        pdfUrl: 'http://minio:9000/pdfs/file.pdf',
      } as Ebook;

      const signedUrl = 'https://minio:9000/pdfs/file.pdf?signature=abc123';

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(ebook);
      mockMinioClient.presignedGetObject.mockResolvedValue(signedUrl);

      const result = await service.getSignedPdfUrl(id);

      expect(result).toBe(signedUrl);
      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        'pdfs',
        'file.pdf',
        3600,
      );
    });

    it('should throw NotFoundException if ebook has no PDF', async () => {
      const id = '1';
      const ebook = {
        id,
        title: 'Test Ebook',
        pdfUrl: null,
      } as Ebook;

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(ebook);

      await expect(service.getSignedPdfUrl(id)).rejects.toThrow(NotFoundException);
    });
  });
});

