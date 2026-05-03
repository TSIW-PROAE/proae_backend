import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ReabrirComplementoDto {
  @ApiProperty({
    description:
      'Novo prazo para o aluno responder à pergunta de complemento',
    example: '2026-03-15T23:59:59.000Z',
  })
  @IsNotEmpty({ message: 'O novo prazo é obrigatório' })
  @IsDateString(
    {},
    { message: 'O prazo deve ser uma data válida (ISO 8601)' },
  )
  novoPrazo: string;
}
