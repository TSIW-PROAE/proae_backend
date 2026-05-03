import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

export class CreateEditalDto {
  @ApiProperty({ description: 'Título do edital' })
  @IsNotEmpty()
  @IsString()
  titulo_edital: string;

  @ApiPropertyOptional({
    enum: NivelAcademico,
    description: 'Graduação (padrão) ou Pós-graduação',
    default: NivelAcademico.GRADUACAO,
  })
  @IsOptional()
  @IsEnum(NivelAcademico)
  nivel_academico?: NivelAcademico;
}
