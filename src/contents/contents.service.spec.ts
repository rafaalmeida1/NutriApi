import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { Content, ContentType } from './entities/content.entity';

describe('ContentsService', () => {
  let service: ContentsService;
  let repository: Repository<Content>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
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
        ContentsService,
        {
          provide: getRepositoryToken(Content),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
    repository = module.get<Repository<Content>>(getRepositoryToken(Content));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new content', async () => {
      const createDto = {
        title: 'Test Content',
        description: 'Test Description',
        type: ContentType.VIDEO,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        contentUrl: 'https://example.com/video.mp4',
      };

      const content = { id: '1', ...createDto, published: false } as Content;

      mockRepository.create.mockReturnValue(content);
      mockRepository.save.mockResolvedValue(content);

      const result = await service.create(createDto);

      expect(result).toEqual(content);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all contents', async () => {
      const contents = [
        { id: '1', title: 'Content 1', type: ContentType.VIDEO, published: true },
        { id: '2', title: 'Content 2', type: ContentType.ARTICLE, published: false },
      ] as Content[];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(contents);

      const result = await service.findAll();

      expect(result).toEqual(contents);
    });

    it('should filter by type', async () => {
      const contents = [
        { id: '1', title: 'Video 1', type: ContentType.VIDEO },
      ] as Content[];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(contents);

      const result = await service.findAll(ContentType.VIDEO);

      expect(result).toEqual(contents);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('content.type = :type', {
        type: ContentType.VIDEO,
      });
    });

    it('should filter published only', async () => {
      const contents = [
        { id: '1', title: 'Published Content', published: true },
      ] as Content[];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue(contents);

      const result = await service.findAll(undefined, true);

      expect(result).toEqual(contents);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('content.published = :published', {
        published: true,
      });
    });
  });

  describe('findOne', () => {
    it('should return a content by id', async () => {
      const id = '1';
      const content = { id, title: 'Test Content', published: true } as Content;

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(content);

      const result = await service.findOne(id);

      expect(result).toEqual(content);
    });

    it('should throw NotFoundException if content not found', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a content', async () => {
      const id = '1';
      const existingContent = {
        id,
        title: 'Old Title',
        published: false,
      } as Content;

      const updateDto = {
        title: 'New Title',
        published: true,
      };

      const updatedContent = { ...existingContent, ...updateDto };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(existingContent);
      mockRepository.save.mockResolvedValue(updatedContent);

      const result = await service.update(id, updateDto);

      expect(result.title).toBe('New Title');
      expect(result.published).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a content', async () => {
      const id = '1';
      const content = { id, title: 'Test Content' } as Content;

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getOne.mockResolvedValue(content);
      mockRepository.remove.mockResolvedValue(content);

      await service.remove(id);

      expect(mockRepository.remove).toHaveBeenCalledWith(content);
    });
  });
});

