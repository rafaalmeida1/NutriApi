import { IsString, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  contentUrl?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}

