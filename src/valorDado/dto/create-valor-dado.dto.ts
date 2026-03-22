import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

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
    example: '550e8400-e29b-41d4-a916-446655440000',
    type: String
  })
  @IsString()
  alunoId: string;

  @ApiProperty({ 
    description: 'ID do Dado',
    example: '550e8400-e29b-41d4-a916-446655440000',
    type: String
  })
  @IsString()
  dadoId: string;
}
