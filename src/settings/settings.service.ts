import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async getHomeBanner(): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({
      where: { key: 'home_banner' },
    });
    return setting?.value || null;
  }

  async setHomeBanner(bannerUrl: string): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({
      where: { key: 'home_banner' },
    });

    if (setting) {
      setting.value = bannerUrl;
      return this.settingsRepository.save(setting);
    } else {
      setting = this.settingsRepository.create({
        key: 'home_banner',
        value: bannerUrl,
      });
      return this.settingsRepository.save(setting);
    }
  }

  async removeHomeBanner(): Promise<void> {
    const setting = await this.settingsRepository.findOne({
      where: { key: 'home_banner' },
    });
    if (setting) {
      await this.settingsRepository.remove(setting);
    }
  }
}

