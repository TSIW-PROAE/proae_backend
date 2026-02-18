import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PerguntaResponseDto } from './response-pergunta.dto';

export class AnswerStepResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a916-446655440000', description: 'ID do step' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Documentação', description: 'Texto do step' })
  texto: string;

  @Expose()
  @ApiProperty({
    type: [PerguntaResponseDto],
    description: 'Lista de perguntas do step',
  })
  perguntas: PerguntaResponseDto[];
}
