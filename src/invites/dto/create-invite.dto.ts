import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  customMessage?: string;
}

