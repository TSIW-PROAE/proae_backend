import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

/** Resposta dentro do body de criação de inscrição (sem inscricaoId; urlArquivo pode ser nome do arquivo ou URL). */
export class RespostaInscricaoDto {
  @ApiProperty({ description: 'ID da pergunta', example: 5 })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsNotEmpty()
  @IsNumber()
  perguntaId: number;

  @ApiPropertyOptional({ description: 'Valor em texto', example: 'Minha resposta' })
  @IsOptional()
  @IsString()
  valorTexto?: string;

  @ApiPropertyOptional({ description: 'Opções selecionadas', example: ['opcao1'] })
  @IsOptional()
  @IsArray()
  valorOpcoes?: string[];

  @ApiPropertyOptional({
    description: 'Nome do arquivo ou URL do arquivo (ex: retorno do upload)',
    example: 'documento.pdf',
  })
  @IsOptional()
  @IsString()
  urlArquivo?: string;
}
