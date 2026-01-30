import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateEbookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsBoolean()
  @IsOptional()
  visibleToAll?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  visibleToUserIds?: string[];
}
