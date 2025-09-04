import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateRespostaDto {
  @ApiProperty({ 
    type: Number, 
    description: 'ID da pergunta',
    example: 1
  })
  @IsNotEmpty()
  @IsNumber()
  pergunta_id: number;

  @ApiPropertyOptional({ 
    type: String, 
    description: 'Texto da resposta (para perguntas de texto)',
    example: 'Minha resposta em texto'
  })
  @IsOptional()
  @IsString()
  texto?: string;

  @ApiPropertyOptional({ 
    type: String, 
    description: 'Valor em texto (para perguntas de input)',
    example: 'João Silva'
  })
  @IsOptional()
  @IsString()
  valorTexto?: string;

  @ApiPropertyOptional({ 
    type: [String], 
    description: 'Valores de múltiplas opções (para perguntas multi-select)',
    example: ['Opção 1', 'Opção 2']
  })
  @IsOptional()
  @IsArray()
  valorOpcoes?: string[];

  @ApiPropertyOptional({ 
    type: String, 
    description: 'URL do arquivo (para perguntas de arquivo)',
    example: 'https://example.com/documento.pdf'
  })
  @IsOptional()
  @IsString()
  urlArquivo?: string;
}
