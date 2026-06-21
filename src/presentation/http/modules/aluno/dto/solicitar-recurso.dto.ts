import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SolicitarRecursoDto {
  @ApiProperty({
    description: 'Justificativa do recurso administrativo da inscrição.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  justificativa: string;
}
