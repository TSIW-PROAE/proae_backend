import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespostaResponseDto {
  @ApiProperty({ description: 'ID da resposta', example: 15 })
  @Expose()
  id: number;

  @ApiPropertyOptional({
    description: 'Valor em texto',
    example: 'Minha resposta',
  })
  @Expose()
  valorTexto?: string;

  @ApiPropertyOptional({
    description: 'Opções selecionadas',
    example: ['opcao1', 'opcao2'],
  })
  @Expose()
  valorOpcoes?: string[];

  @ApiPropertyOptional({
    description: 'URL do arquivo',
    example: 'http://meuarquivo.com/file.pdf',
  })
  @Expose()
  urlArquivo?: string;

  @ApiProperty({
    description: 'Data da resposta',
    example: '2025-09-03T12:00:00Z',
  })
  @Expose()
  dataResposta: Date;

  @ApiProperty({ description: 'ID da pergunta', example: 12 })
  @Expose()
  perguntaId: number;

  @ApiProperty({ description: 'ID da inscrição', example: 15 })
  @Expose()
  inscricaoId: number;
}
