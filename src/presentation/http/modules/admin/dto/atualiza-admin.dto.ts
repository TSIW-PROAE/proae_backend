import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class AtualizaAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Cargo na PROAE' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({ required: false, example: '2000-01-01' })
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  celular?: string;
}
