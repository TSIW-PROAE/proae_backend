import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EnumTipoInput } from 'src/core/shared-kernel/enums/enumTipoInput';

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
    example: ['Opcao 1', 'Opcao 2', 'Opcao 3'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opcoes?: string[];
}
