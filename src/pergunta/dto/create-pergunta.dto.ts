import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { EnumInputFormat } from '../../enum/enumInputFormat';
import { EnumTipoInput } from '../../enum/enumTipoInput';

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
    example: EnumTipoInput.INPUT,
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

  @ApiProperty({
    description: 'ID do formulário ao qual a pergunta pertence',
    example: 3,
  })
  @IsNumber()
  formularioId: number;

  @ApiPropertyOptional({
    description: 'ID do Dado vinculado (ex: CPF, RG, Data de Nascimento)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  dadoId?: number;
}
