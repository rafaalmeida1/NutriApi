import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EbooksService } from './ebooks.service';
import { EbooksController } from './ebooks.controller';
import { Ebook } from './entities/ebook.entity';
import { OptionalAuthInterceptor } from '../common/interceptors/optional-auth.interceptor';
import { UsersModule } from '../users/users.module';
import { UploadModule } from '../upload/upload.module';
import { jwtConfig } from '../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ebook]),
    JwtModule.registerAsync({
      useFactory: jwtConfig,
    }),
    UsersModule,
    UploadModule,
  ],
  controllers: [EbooksController],
  providers: [EbooksService, OptionalAuthInterceptor],
  exports: [EbooksService],
})
export class EbooksModule {}

