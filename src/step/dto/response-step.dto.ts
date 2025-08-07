import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PerguntaResponseDto } from './response-pergunta.dto';

export class StepResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID do step' })
  id: number;

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
