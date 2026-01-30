import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateEbookDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsBoolean()
  @IsOptional()
  visibleToAll?: boolean; // Se true, visível para todos

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  visibleToUserIds?: string[]; // IDs dos pacientes específicos

  @IsBoolean()
  @IsOptional()
  published?: boolean; // Se true, publicado e visível para pacientes
}
