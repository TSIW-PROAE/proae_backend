import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EnumInputFormat } from 'src/core/shared-kernel/enums/enumInputFormat';
import { EnumTipoInput } from 'src/core/shared-kernel/enums/enumTipoInput';

const TIPO_PERGUNTA_MAP: Record<string, string> = {
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

export class CreatePerguntaDto {
  @ApiProperty({
    description: 'ID do step ao qual a pergunta pertence',
    example: 9,
  })
  @IsNotEmpty()
  @IsNumber()
  step_id: number;

  @ApiProperty({
    enum: EnumTipoInput,
    description: 'Tipo da pergunta',
    example: EnumTipoInput.TEXT,
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return TIPO_PERGUNTA_MAP[value.toLowerCase().trim()] ?? value.toLowerCase().trim();
  })
  @IsNotEmpty()
  @IsEnum(EnumTipoInput)
  tipo_Pergunta: EnumTipoInput;

  @ApiProperty({ description: 'Texto da pergunta', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  pergunta: string;

  @ApiProperty({ description: 'Se a pergunta é obrigatória', default: false })
  @IsBoolean()
  obrigatoriedade: boolean;

  @ApiProperty({
    type: [String],
    description: 'Opções para perguntas do tipo select',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opcoes?: string[];

  @ApiProperty({
    enum: EnumInputFormat,
    description: 'Formato de entrada da pergunta',
    required: false,
  })
  @IsOptional()
  @IsEnum(EnumInputFormat)
  tipo_formatacao?: EnumInputFormat;

  @ApiPropertyOptional({
    description: 'ID do Dado vinculado (ex: CPF, RG, Data de Nascimento)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  dadoId?: number;
}
