import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EnumInputFormat } from '../../enum/enumInputFormat';
import { EnumTipoInput } from '../../enum/enumTipoInput';

export class CreatePerguntaDto {
  @ApiProperty({
    description: 'ID do step ao qual a pergunta pertence',
    example: '550e8400-e29b-41d4-a916-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  step_id: string;

  @ApiProperty({
    enum: EnumTipoInput,
    description: 'Tipo da pergunta',
    example: EnumTipoInput.TEXT,
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
    example: '550e8400-e29b-41d4-a916-446655440000',
  })
  @IsString()
  @IsOptional()
  dadoId?: string;

  @ApiPropertyOptional({
    description:
      'Prazo para os alunos já inscritos responderem a nova pergunta. Obrigatório quando já existem inscrições com respostas neste edital.',
    example: '2026-03-15T23:59:59.000Z',
  })
  @IsOptional()
  @IsString()
  prazoResposta?: string;
}
