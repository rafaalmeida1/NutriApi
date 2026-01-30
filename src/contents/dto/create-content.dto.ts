import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { ContentType } from '../entities/content.entity';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  contentUrl?: string;
}

