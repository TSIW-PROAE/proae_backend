import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EnumInputFormat } from '../../enum/enumInputFormat';

export class UpdatePerguntaDto {
  @ApiProperty({ description: 'Texto da pergunta', maxLength: 255, required: false })
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
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opcoes?: string[];

  @ApiProperty({ 
    enum: EnumInputFormat,
    description: 'Formato de entrada da pergunta',
    required: false
  })
  @IsOptional()
  @IsEnum(EnumInputFormat)
  tipo_formatacao?: EnumInputFormat;
}
