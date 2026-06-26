import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const RESULTADO_FASE_OPCOES = [
  'Nao publicado',
  'Resultado preliminar',
  'Resultado final',
] as const;

export const RECURSO_STATUS_OPCOES = [
  'Sem recurso',
  'Recurso solicitado',
  'Recurso deferido',
  'Recurso indeferido',
] as const;

export class UpdateAdminResultadoRecursoDto {
  @ApiProperty({
    enum: RESULTADO_FASE_OPCOES,
    description:
      'Fase de divulgação do resultado para a inscrição (não publicado, preliminar ou final).',
  })
  @IsIn(RESULTADO_FASE_OPCOES)
  resultado_fase: (typeof RESULTADO_FASE_OPCOES)[number];

  @ApiProperty({
    enum: RECURSO_STATUS_OPCOES,
    description: 'Situação do recurso administrativo do estudante.',
  })
  @IsIn(RECURSO_STATUS_OPCOES)
  recurso_status: (typeof RECURSO_STATUS_OPCOES)[number];

  @ApiPropertyOptional({
    description:
      'Observação/parecer do recurso (opcional e visível ao estudante).',
  })
  @IsOptional()
  @IsString()
  recurso_observacao?: string;
}
