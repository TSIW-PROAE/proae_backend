import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class CreateValorDadoDto {
  @ApiPropertyOptional({ description: 'Valor em texto' })
  @IsOptional()
  @IsString()
  valorTexto?: string;

  @ApiPropertyOptional({ description: 'Valor de múltiplas opções' })
  @IsOptional()
  @IsArray()
  valorOpcoes?: string[];

  @ApiPropertyOptional({ description: 'Valor de arquivo (URL ou path)' })
  @IsOptional()
  @IsString()
  valorArquivo?: string;

  @ApiPropertyOptional({ description: 'ID do aluno', example: 1 })
  @IsNumber()
  alunoId: number;

  @ApiPropertyOptional({ description: 'ID do Dado', example: 1 })
  @IsNumber()
  dadoId: number;
}
