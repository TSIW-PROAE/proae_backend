import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
} from 'class-validator';

export class CreateRespostaDto {
  @ApiProperty({ description: 'ID da pergunta', example: '550e8400-e29b-41d4-a916-446655440000' })
  @IsString()
  @IsNotEmpty()
  perguntaId: string;

  @ApiPropertyOptional({
    description: 'ID da inscrição (opcional na criação de inscrição)',
    example: '550e8400-e29b-41d4-a916-446655440000',
  })
  @IsOptional()
  @IsString()
  inscricaoId?: string;

  @ApiPropertyOptional({
    description: 'Valor em texto',
    example: 'Minha resposta',
  })
  @IsOptional()
  @IsString()
  valorTexto?: string;

  @ApiPropertyOptional({
    description: 'Opções selecionadas',
    example: ['opcao1', 'opcao2'],
  })
  @IsOptional()
  @IsArray()
  valorOpcoes?: string[];

  @ApiPropertyOptional({
    description: 'Nome do arquivo (enviado via multipart/form-data no campo files)',
    example: 'meu_documento.pdf',
  })
  @IsOptional()
  @IsString()
  urlArquivo?: string;
}
