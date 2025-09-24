import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class CreateValorDadoDto {
  @ApiPropertyOptional({ 
    description: 'Valor em texto',
    example: 'João Silva',
    required: false
  })
  @IsOptional()
  @IsString()
  valorTexto?: string;

  @ApiPropertyOptional({ 
    description: 'Valor de múltiplas opções',
    type: [String],
    example: ['Opção 1', 'Opção 2'],
    required: false
  })
  @IsOptional()
  @IsArray()
  valorOpcoes?: string[];

  @ApiPropertyOptional({ 
    description: 'Valor de arquivo (URL ou path)',
    example: 'https://example.com/documento.pdf',
    required: false
  })
  @IsOptional()
  @IsString()
  valorArquivo?: string;

  @ApiProperty({ 
    description: 'ID do aluno',
    example: 1,
    type: Number
  })
  @IsNumber()
  alunoId: number;

  @ApiProperty({ 
    description: 'ID do Dado',
    example: 1,
    type: Number
  })
  @IsNumber()
  dadoId: number;
}
