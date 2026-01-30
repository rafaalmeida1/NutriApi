import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('home-banner')
  @Public()
  @ApiOperation({ summary: 'Obter banner da página principal' })
  async getHomeBanner() {
    const bannerUrl = await this.settingsService.getHomeBanner();
    return { bannerUrl };
  }

  @Post('home-banner')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Definir banner da página principal (Admin only)' })
  async setHomeBanner(@Body() body: { bannerUrl: string }) {
    const setting = await this.settingsService.setHomeBanner(body.bannerUrl);
    return { bannerUrl: setting.value };
  }

  @Delete('home-banner')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover banner da página principal (Admin only)' })
  async removeHomeBanner() {
    await this.settingsService.removeHomeBanner();
  }
}

