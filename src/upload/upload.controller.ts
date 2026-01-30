import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('upload')
@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload/image')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de imagem (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }

  @Post('upload/pdf')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de PDF (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }
    const url = await this.uploadService.uploadPdf(file);
    return { url };
  }

  // Rotas públicas para servir arquivos estáticos
  @Get('files/images/:filename')
  @Public()
  @ApiOperation({ summary: 'Servir imagem' })
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, 'images', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Imagem não encontrada');
    }

    // Determinar content-type baseado na extensão
    const ext = path.extname(filename).toLowerCase();
    const contentType = this.getContentType(ext);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    res.sendFile(path.resolve(filePath));
  }

  @Get('files/pdfs/:filename')
  @Public()
  @ApiOperation({ summary: 'Servir PDF' })
  async getPdf(@Param('filename') filename: string, @Res() res: Response) {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, 'pdfs', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('PDF não encontrado');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 ano
    res.sendFile(path.resolve(filePath));
  }

  private getContentType(ext: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}
