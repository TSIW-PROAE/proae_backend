import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PerguntaComRespostaDto {
  @ApiProperty({
    description: 'ID da pergunta',
    example: 1,
  })
  @Expose()
  perguntaId: number;

  @ApiProperty({
    description: 'Texto da pergunta',
    example: 'Qual é o seu nome completo?',
  })
  @Expose()
  pergunta: string;

  @ApiProperty({
    description: 'Indica se a pergunta é obrigatória',
    example: true,
  })
  @Expose()
  obrigatoriedade: boolean;

  @ApiProperty({
    description: 'Tipo da pergunta',
    example: 'TEXTO',
  })
  @Expose()
  tipoPergunta: string;

  @ApiProperty({
    description: 'Opções disponíveis para perguntas do tipo múltipla escolha',
    example: ['Opção 1', 'Opção 2'],
    required: false,
  })
  @Expose()
  opcoes?: string[];

  @ApiProperty({
    description: 'ID da resposta, se existir',
    example: 1,
    required: false,
  })
  @Expose()
  respostaId?: number;

  @ApiProperty({
    description: 'Valor em texto da resposta',
    example: 'João da Silva',
    required: false,
  })
  @Expose()
  valorTexto?: string;

  @ApiProperty({
    description: 'Opções selecionadas na resposta',
    example: ['Opção 1'],
    required: false,
  })
  @Expose()
  valorOpcoes?: string[];

  @ApiProperty({
    description: 'URL do arquivo enviado como resposta',
    example: 'https://storage.example.com/arquivo.pdf',
    required: false,
  })
  @Expose()
  urlArquivo?: string;

  @ApiProperty({
    description: 'Data da resposta',
    example: '2026-01-11T10:30:00Z',
    required: false,
  })
  @Expose()
  dataResposta?: Date;

  @ApiProperty({
    description: 'Indica se a resposta foi validada',
    example: false,
    required: false,
  })
  @Expose()
  validada?: boolean;
}

export class StepRespostasResponseDto {
  @ApiProperty({
    description: 'ID do step',
    example: 1,
  })
  @Expose()
  stepId: number;

  @ApiProperty({
    description: 'Texto do step',
    example: 'Dados Pessoais',
  })
  @Expose()
  stepTexto: string;

  @ApiProperty({
    description: 'ID do edital',
    example: 1,
  })
  @Expose()
  editalId: number;

  @ApiProperty({
    description: 'ID do aluno',
    example: 1,
  })
  @Expose()
  alunoId: number;

  @ApiProperty({
    description: 'ID da inscrição',
    example: 1,
    required: false,
  })
  @Expose()
  inscricaoId?: number;

  @ApiProperty({
    description: 'Lista de perguntas com suas respectivas respostas',
    type: [PerguntaComRespostaDto],
  })
  @Expose()
  perguntas: PerguntaComRespostaDto[];
}
