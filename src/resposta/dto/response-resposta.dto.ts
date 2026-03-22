import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespostaResponseDto {
  @ApiProperty({ description: 'ID da resposta', example: '550e8400-e29b-41d4-a916-446655440000' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Texto da resposta (para perguntas de texto)',
    example: 'Minha resposta em texto',
  })
  @Expose()
  texto?: string;

  @ApiPropertyOptional({
    description: 'Valor em texto (para perguntas de input)',
    example: 'João Silva',
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

  @ApiProperty({ description: 'ID da pergunta', example: '550e8400-e29b-41d4-a916-446655440000' })
  @Expose()
  perguntaId: string;

  @ApiProperty({ description: 'ID da inscrição', example: '550e8400-e29b-41d4-a916-446655440000' })
  @Expose()
  inscricaoId: string;

  @ApiPropertyOptional({
    description: 'Indica se a resposta foi validada',
    example: true,
  })
  @Expose()
  validada?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se a resposta foi invalidada',
    example: false,
  })
  @Expose()
  invalidada?: boolean;

  @ApiPropertyOptional({
    description: 'Data de validação da resposta',
    example: '2025-09-03T12:00:00Z',
  })
  @Expose()
  dataValidacao?: Date;

  @ApiPropertyOptional({
    description: 'Data de validade da resposta',
    example: '2025-12-31T23:59:59Z',
  })
  @Expose()
  dataValidade?: Date;

  @ApiPropertyOptional({
    description: 'Parecer sobre a resposta',
    example: 'Documento precisa ser mais legível',
  })
  @Expose()
  parecer?: string;

  @ApiPropertyOptional({
    description: 'Prazo para reenvio da resposta',
    example: '2025-12-31T23:59:59Z',
  })
  @Expose()
  prazoReenvio?: Date;

  @ApiPropertyOptional({
    description: 'Indica se a resposta requer reenvio/correção',
    example: false,
  })
  @Expose()
  requerReenvio?: boolean;

  @ApiPropertyOptional({
    description:
      'Indica se esta resposta foi criada automaticamente porque uma nova pergunta foi adicionada após a inscrição do aluno',
    example: true,
  })
  @Expose()
  perguntaAdicionadaPosInscricao?: boolean;

  @ApiPropertyOptional({
    description:
      'Prazo para o aluno responder à nova pergunta adicionada após a inscrição',
    example: '2026-03-15T23:59:59Z',
  })
  @Expose()
  prazoRespostaNovaPergunta?: Date;
}
