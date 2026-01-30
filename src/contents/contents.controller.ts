import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { ContentType } from './entities/content.entity';

@ApiTags('contents')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar conteúdo (Admin only)' })
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentsService.create(createContentDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar conteúdos' })
  @ApiQuery({ name: 'type', required: false, enum: ContentType })
  async findAll(@Query('type') type?: ContentType, @Req() req?: any) {
    const isAdmin = req?.user?.role === 'admin';
    return this.contentsService.findAll(type, !isAdmin);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Detalhes de um conteúdo' })
  async findOne(@Param('id') id: string, @Req() req?: any) {
    const isAdmin = req?.user?.role === 'admin';
    return this.contentsService.findOne(id, !isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar conteúdo (Admin only)' })
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentsService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar conteúdo (Admin only)' })
  remove(@Param('id') id: string) {
    return this.contentsService.remove(id);
  }
}

