import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { InviteStatus } from './entities/invite.entity';

@ApiTags('invites')
@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar convite (Admin only)' })
  async create(@Body() createInviteDto: CreateInviteDto) {
    return this.invitesService.create(
      createInviteDto.email,
      createInviteDto.name,
      createInviteDto.customMessage,
    );
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar convites (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: InviteStatus })
  async findAll(@Query('status') status?: InviteStatus) {
    try {
      const invites = await this.invitesService.findAll(status);
      return invites;
    } catch (error: any) {
      console.error('Erro ao listar convites:', error);
      throw error;
    }
  }

  @Get('accept/:token')
  @Public()
  @ApiOperation({ summary: 'Validar token de convite (Rota pública)' })
  async accept(@Param('token') token: string) {
    const invite = await this.invitesService.findByToken(token);
    return {
      valid: true,
      email: invite.email,
      name: invite.name,
    };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar convite (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.invitesService.remove(id);
  }

  @Post(':id/resend')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reenviar email de convite (Admin only)' })
  async resend(@Param('id') id: string) {
    return this.invitesService.resend(id);
  }
}

