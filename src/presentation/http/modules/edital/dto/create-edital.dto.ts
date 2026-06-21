import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

export class CreateEditalDto {
  @ApiProperty({ description: 'Título do edital' })
  @IsNotEmpty()
  @IsString()
  titulo_edital: string;

  @ApiPropertyOptional({
    description:
      'Quando true, aplica template padrão de perguntas com pesos no novo edital.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  aplicar_template_cadastro?: boolean;

  @ApiPropertyOptional({
    description:
      'Quando true, cria o edital de renovação anual de benefícios.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_formulario_renovacao?: boolean;

  @ApiPropertyOptional({
    description:
      'Quando true, libera inscrições de alunos neste edital (independe do status do edital).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  inscricoes_abertas?: boolean;

  @ApiPropertyOptional({
    description:
      'Quando true, libera ajustes/correções de pendências para alunos neste edital.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ajustes_abertos?: boolean;

  @ApiPropertyOptional({
    enum: NivelAcademico,
    description: 'Graduação (padrão) ou Pós-graduação',
    default: NivelAcademico.GRADUACAO,
  })
  @IsOptional()
  @IsEnum(NivelAcademico)
  nivel_academico?: NivelAcademico;
}
