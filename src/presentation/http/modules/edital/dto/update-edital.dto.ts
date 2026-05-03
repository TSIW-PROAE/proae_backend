import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

class EditalUrlDto {
  @ApiProperty({ description: 'Título do documento' })
  @IsString()
  titulo_documento: string;

  @ApiProperty({ description: 'URL do documento' })
  @IsString()
  url_documento: string;
}

class EtapaEditalDto {
  @ApiProperty({ description: 'Nome da etapa' })
  @IsString()
  etapa: string;

  @ApiProperty({ description: 'Ordem do elemento' })
  @IsNumber()
  ordem_elemento: number;

  @ApiProperty({ description: 'Data de início da etapa' })
  @IsDateString()
  data_inicio: Date;

  @ApiProperty({ description: 'Data de fim da etapa' })
  @IsDateString()
  data_fim: Date;
}

export class UpdateEditalDto {
  @ApiProperty({ description: 'Título do edital', required: false })
  @IsOptional()
  @IsString()
  titulo_edital?: string;

  @ApiProperty({ description: 'Descrição do edital', required: false })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    type: [EditalUrlDto],
    description: 'URLs dos documentos do edital',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditalUrlDto)
  edital_url?: EditalUrlDto[];

  @ApiProperty({
    type: [EtapaEditalDto],
    description: 'Etapas do edital',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtapaEditalDto)
  etapa_edital?: EtapaEditalDto[];

  @ApiProperty({
    description:
      'Data fim da vigência no portal (YYYY-MM-DD). Omitir para não alterar; null para limpar.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  data_fim_vigencia?: string | null;

  @ApiPropertyOptional({ enum: NivelAcademico })
  @IsOptional()
  @IsEnum(NivelAcademico)
  nivel_academico?: NivelAcademico;
}
