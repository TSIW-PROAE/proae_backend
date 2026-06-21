import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

class EditalUrlResponseDto {
  @ApiProperty({ description: 'Título do documento' })
  @Expose()
  titulo_documento: string;

  @ApiProperty({ description: 'URL do documento' })
  @Expose()
  url_documento: string;
}

class EtapaEditalResponseDto {
  @ApiProperty({ description: 'Nome da etapa' })
  @Expose()
  etapa: string;

  @ApiProperty({
    required: false,
    description:
      'Tipo semântico opcional da etapa (ex.: INSCRICAO, RECURSO, RESULTADO_PRELIMINAR).',
  })
  @Expose()
  tipo_etapa?: string;

  @ApiProperty({ description: 'Ordem do elemento' })
  @Expose()
  ordem_elemento: number;

  @ApiProperty({ description: 'Data de início da etapa' })
  @Expose()
  data_inicio: Date;

  @ApiProperty({ description: 'Data de fim da etapa' })
  @Expose()
  data_fim: Date;
}

export class EditalResponseDto {
  @ApiProperty({ type: Number, description: 'ID do edital' })
  @Expose()
  id: number;

  @ApiProperty({ type: String, description: 'Título do edital' })
  @Expose()
  titulo_edital: string;

  @ApiProperty({ type: String, description: 'Descrição do edital' })
  @Expose()
  descricao?: string;

  @ApiProperty({
    type: [EditalUrlResponseDto],
    description: 'URLs dos documentos do edital',
  })
  @Expose()
  @Type(() => EditalUrlResponseDto)
  edital_url?: EditalUrlResponseDto[];

  @ApiProperty({ enum: StatusEdital, description: 'Status do edital' })
  @Expose()
  status_edital: StatusEdital;

  @ApiProperty({
    type: Boolean,
    description:
      'Indica se o edital é de renovação anual de benefícios.',
  })
  @Expose()
  is_formulario_renovacao?: boolean;

  @ApiProperty({
    type: Boolean,
    description:
      'Indica se as inscrições estão abertas neste edital (controle manual).',
  })
  @Expose()
  inscricoes_abertas?: boolean;

  @ApiProperty({
    type: Boolean,
    description:
      'Indica se os ajustes/correções de pendências estão abertos para alunos.',
  })
  @Expose()
  ajustes_abertos?: boolean;

  @ApiProperty({
    type: [EtapaEditalResponseDto],
    description: 'Etapas do edital',
  })
  @Expose()
  @Type(() => EtapaEditalResponseDto)
  etapa_edital?: EtapaEditalResponseDto[];

  @ApiProperty({ type: Date, description: 'Data de criação' })
  @Expose()
  created_at: Date;

  @ApiProperty({ type: Date, description: 'Data de atualização' })
  @Expose()
  updated_at: Date;

  @ApiProperty({ enum: NivelAcademico, description: 'Graduação ou Pós-graduação' })
  @Expose()
  nivel_academico: NivelAcademico;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Fim da vigência no portal (avisos ao aluno)',
  })
  @Expose()
  data_fim_vigencia?: Date | null;
}
