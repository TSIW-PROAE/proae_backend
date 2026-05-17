import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EnumInputFormat } from 'src/core/shared-kernel/enums/enumInputFormat';
import { PerguntaCondicaoDto } from './create-pergunta.dto';

export class UpdatePerguntaDto {
  @ApiProperty({
    description: 'Texto da pergunta',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pergunta?: string;

  @ApiProperty({ description: 'Se a pergunta é obrigatória', required: false })
  @IsOptional()
  @IsBoolean()
  obrigatoriedade?: boolean;

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
    description:
      'ID do Dado vinculado (ex: CPF, RG, Data de Nascimento). Use null para remover a vinculação.',
    example: 10,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  dadoId?: number | null;

  @ApiPropertyOptional({
    description: 'Nova posição relativa da pergunta dentro do step.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional({
    description:
      'Regra de exibição condicional. Envie null para remover a condição.',
    type: PerguntaCondicaoDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PerguntaCondicaoDto)
  condicao?: PerguntaCondicaoDto | null;
}
