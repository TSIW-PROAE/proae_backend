import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { EnumInputFormat } from 'src/core/shared-kernel/enums/enumInputFormat';
import { EnumTipoInput } from 'src/core/shared-kernel/enums/enumTipoInput';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

const TIPO_PERGUNTA_VALIDOS = Object.values(EnumTipoInput) as string[];

/** Normaliza valor enviado pelo front (TEXT, Texto, etc.) para o enum (text, textarea, etc.). */
function normalizarTipoPergunta(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const lower = value.toLowerCase().trim();
  const map: Record<string, string> = {
    texto: EnumTipoInput.TEXT,
    text: EnumTipoInput.TEXT,
    numero: EnumTipoInput.NUMBER,
    number: EnumTipoInput.NUMBER,
    senha: EnumTipoInput.PASSWORD,
    password: EnumTipoInput.PASSWORD,
    email: EnumTipoInput.EMAIL,
    textarea: EnumTipoInput.TEXT_AREA,
    'text area': EnumTipoInput.TEXT_AREA,
    select: EnumTipoInput.SELECT,
    radio: EnumTipoInput.RADIO,
    data: EnumTipoInput.DATE,
    date: EnumTipoInput.DATE,
    arquivo: EnumTipoInput.FILE,
    file: EnumTipoInput.FILE,
    selectgroup: EnumTipoInput.SELECT_GROUP,
    select_group: EnumTipoInput.SELECT_GROUP,
    textinputgroup: EnumTipoInput.TEXT_INPUT_GROUP,
    text_input_group: EnumTipoInput.TEXT_INPUT_GROUP,
  };
  return map[lower] ?? lower;
}

export class PerguntaFormularioGeralDto {
  @ApiProperty({ enum: EnumTipoInput, example: EnumTipoInput.TEXT })
  @Transform(({ value }) => normalizarTipoPergunta(value))
  @IsEnum(EnumTipoInput, {
    message: `tipo_Pergunta deve ser um dos: ${TIPO_PERGUNTA_VALIDOS.join(', ')}`,
  })
  tipo_Pergunta: EnumTipoInput;

  @ApiProperty({ maxLength: 255 })
  @IsString({ message: 'pergunta deve ser um texto' })
  @MaxLength(255, { message: 'pergunta deve ter no máximo 255 caracteres' })
  pergunta: string;

  @ApiProperty({ default: false })
  @IsBoolean({ message: 'obrigatoriedade deve ser true ou false' })
  obrigatoriedade: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opcoes?: string[];

  @ApiPropertyOptional({ enum: EnumInputFormat })
  @IsOptional()
  @IsEnum(EnumInputFormat)
  tipo_formatacao?: EnumInputFormat;
}

export class StepFormularioGeralDto {
  @ApiProperty({ description: 'Texto do step (ex.: Dados pessoais)' })
  @IsString({ message: 'texto do step deve ser um texto' })
  texto: string;

  @ApiProperty({ type: [PerguntaFormularioGeralDto], description: 'Perguntas deste step' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerguntaFormularioGeralDto)
  perguntas: PerguntaFormularioGeralDto[];
}

export class CreateFormularioGeralDto {
  @ApiPropertyOptional({ example: 'Formulário Geral', description: 'Se omitido, usa "Formulário Geral"' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value == null || value === '' ? 'Formulário Geral' : value))
  titulo_edital?: string;

  @ApiPropertyOptional({
    enum: NivelAcademico,
    description: 'Nível deste formulário (um FG ativo por nível). Padrão: Graduação.',
    default: NivelAcademico.GRADUACAO,
  })
  @IsOptional()
  @IsEnum(NivelAcademico)
  nivel_academico?: NivelAcademico;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    type: [StepFormularioGeralDto],
    description: 'Steps com perguntas. Se não enviar, o admin pode adicionar depois via /steps e /perguntas.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepFormularioGeralDto)
  steps?: StepFormularioGeralDto[];
}
