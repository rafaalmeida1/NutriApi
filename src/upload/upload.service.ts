import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadsDir: string;
  private readonly imagesDir: string;
  private readonly pdfsDir: string;
  private readonly baseUrl: string;

  constructor() {
    // Diretório base para uploads (dentro do container Docker)
    this.uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    this.imagesDir = path.join(this.uploadsDir, 'images');
    this.pdfsDir = path.join(this.uploadsDir, 'pdfs');
    this.baseUrl = process.env.API_URL || 'http://localhost:3055';

    // Criar diretórios se não existirem
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist() {
    try {
      [this.uploadsDir, this.imagesDir, this.pdfsDir].forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`✅ Diretório criado: ${dir}`);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar diretórios de upload:', error);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF');
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.imagesDir, fileName);

    try {
      // Salvar arquivo no sistema de arquivos
      fs.writeFileSync(filePath, file.buffer);
      console.log(`✅ Imagem salva: ${filePath} (${file.size} bytes)`);

      // Retornar URL relativa que será servida pela API
      const url = `${this.baseUrl}/files/images/${fileName}`;
      return url;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      throw new BadRequestException(`Erro ao fazer upload do arquivo: ${error.message}`);
    }
  }

  async uploadPdf(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Tipo de arquivo não permitido. Use PDF');
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.pdfsDir, fileName);

    try {
      // Salvar arquivo no sistema de arquivos
      fs.writeFileSync(filePath, file.buffer);
      console.log(`✅ PDF salvo: ${filePath} (${file.size} bytes)`);

      // Retornar URL relativa que será servida pela API
      const url = `${this.baseUrl}/files/pdfs/${fileName}`;
      return url;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload do PDF:', error);
      throw new BadRequestException(`Erro ao fazer upload do arquivo: ${error.message}`);
    }
  }

  // Método para deletar arquivo (usado quando e-book é deletado)
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extrair o nome do arquivo da URL
      // URL format: http://localhost:3055/files/images/filename.jpg
      // ou: http://localhost:3055/files/pdfs/filename.pdf
      const urlParts = fileUrl.split('/files/');
      if (urlParts.length !== 2) {
        console.warn(`⚠️  URL inválida para deletar: ${fileUrl}`);
        return;
      }

      const [type, fileName] = urlParts[1].split('/');
      let filePath: string;

      if (type === 'images') {
        filePath = path.join(this.imagesDir, fileName);
      } else if (type === 'pdfs') {
        filePath = path.join(this.pdfsDir, fileName);
      } else {
        console.warn(`⚠️  Tipo de arquivo desconhecido: ${type}`);
        return;
      }

      // Verificar se o arquivo existe antes de deletar
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Arquivo deletado: ${filePath}`);
      } else {
        console.warn(`⚠️  Arquivo não encontrado para deletar: ${filePath}`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao deletar arquivo ${fileUrl}:`, error);
      // Não lançar erro para não quebrar o fluxo de deleção do e-book
    }
  }
}
