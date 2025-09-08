import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';
import { EnumTipoInput } from '@/src/enum/enumTipoInput';

export class CreateDadoDto {
  @ApiProperty({ description: 'Nome do dado', example: 'CPF' })
  @IsString()
  @MaxLength(255)
  nome: string;

  @ApiProperty({
    description: 'Tipo de input',
    enum: EnumTipoInput,
    example: EnumTipoInput.TEXT,
  })
  @IsEnum(EnumTipoInput)
  tipo: EnumTipoInput;

  @ApiPropertyOptional({ description: 'Campo obrigatório?', default: false })
  @IsOptional()
  @IsBoolean()
  obrigatorio?: boolean;

  @ApiPropertyOptional({
    description: 'Opções para select/multi-select',
    type: [String],
    example: ['Opção 1', 'Opção 2', 'Opção 3'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opcoes?: string[];
}
