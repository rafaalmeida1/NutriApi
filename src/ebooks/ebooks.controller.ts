import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EbooksService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { OptionalAuthInterceptor } from '../common/interceptors/optional-auth.interceptor';

@ApiTags('ebooks')
@Controller('ebooks')
export class EbooksController {
  constructor(private readonly ebooksService: EbooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar e-book (Admin only)' })
  async create(@Body() createEbookDto: CreateEbookDto) {
    try {
      const ebook = await this.ebooksService.create(createEbookDto);
      return ebook;
    } catch (error: any) {
      console.error('Erro ao criar e-book:', error);
      throw error;
    }
  }

  @Get()
  @Public()
  @UseInterceptors(OptionalAuthInterceptor)
  @ApiOperation({ summary: 'Listar e-books' })
  async findAll(@Req() req?: any) {
    // Verificar se há usuário autenticado (mesmo sendo rota pública)
    // Se for admin, mostrar todos os e-books (incluindo não publicados)
    // Se não for admin ou não autenticado, mostrar apenas publicados
    const user = req?.user;
    const isAdmin = user?.role === 'admin';
    const userId = user?.id;
    console.log(`GET /ebooks - User: ${user?.email || 'Guest'} (role: ${user?.role || 'none'}) - isAdmin: ${isAdmin} - userId: ${userId}`);
    return this.ebooksService.findAll(!isAdmin, userId, isAdmin);
  }

  @Get(':id')
  @Public()
  @UseInterceptors(OptionalAuthInterceptor)
  @ApiOperation({ summary: 'Detalhes de um e-book' })
  async findOne(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user;
    const isAdmin = user?.role === 'admin';
    const userId = user?.id;
    console.log(`GET /ebooks/${id} - User: ${user?.email || 'Guest'} (role: ${user?.role || 'none'}) - isAdmin: ${isAdmin} - userId: ${userId}`);
    return this.ebooksService.findOne(id, !isAdmin, userId, isAdmin);
  }

  @Get(':id/pdf')
  @Public()
  @UseInterceptors(OptionalAuthInterceptor)
  @ApiOperation({ summary: 'Obter URL do PDF' })
  async getPdfUrl(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user;
    const isAdmin = user?.role === 'admin';
    const userId = user?.id;
    const url = await this.ebooksService.getSignedPdfUrl(id, userId, isAdmin);
    return { url };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar e-book (Admin only)' })
  async update(@Param('id') id: string, @Body() updateEbookDto: UpdateEbookDto) {
    try {
      const ebook = await this.ebooksService.update(id, updateEbookDto);
      return ebook;
    } catch (error: any) {
      console.error('Erro ao atualizar e-book:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar e-book (Admin only)' })
  async remove(@Param('id') id: string) {
    try {
      await this.ebooksService.remove(id);
      return { message: 'E-book deletado com sucesso' };
    } catch (error: any) {
      console.error('Erro ao deletar e-book:', error);
      throw error;
    }
  }
}

