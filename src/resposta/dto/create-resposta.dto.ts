import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
  IsNumber,
} from 'class-validator';

export class CreateRespostaDto {
  @ApiProperty({ description: 'ID da pergunta', example: 5 })
  @IsNumber()
  @IsNotEmpty()
  perguntaId: number;

  @ApiPropertyOptional({ description: 'ID da inscrição', example: 2 })
  @IsOptional()
  @IsNumber()
  inscricaoId?: number;

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
    description: 'URL de arquivo',
    example: 'http://meuarquivo.com/file.pdf',
  })
  @IsOptional()
  @IsUrl()
  urlArquivo?: string;
}
