import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  const mockMinioClient = {
    bucketExists: jest.fn(),
    makeBucket: jest.fn(),
    putObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    
    // Mock MinIO client
    (service as any).minioClient = mockMinioClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should upload a valid image', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadImage(file);

      expect(result).toContain('images');
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      await expect(service.uploadImage(file)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no file provided', async () => {
      await expect(service.uploadImage(null as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadPdf', () => {
    it('should upload a valid PDF', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadPdf(file);

      expect(result).toContain('pdfs');
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      await expect(service.uploadPdf(file)).rejects.toThrow(BadRequestException);
    });
  });
});

