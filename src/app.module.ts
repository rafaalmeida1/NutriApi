import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvitesModule } from './invites/invites.module';
import { ContentsModule } from './contents/contents.module';
import { EbooksModule } from './ebooks/ebooks.module';
import { UploadModule } from './upload/upload.module';
import { PatientsModule } from './patients/patients.module';
import { SettingsModule } from './settings/settings.module';
import { databaseConfig } from './config/database.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      ignoreEnvFile: false,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig(),
    }),
    AuthModule,
    UsersModule,
    InvitesModule,
    ContentsModule,
    EbooksModule,
    UploadModule,
    PatientsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

