import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { RespostaInscricaoDto } from './resposta-inscricao.dto';

export class CorrigirRespostasInscricaoDto {
  @ApiProperty({
    type: [RespostaInscricaoDto],
    description:
      'Respostas a atualizar (normalmente as pendentes de ajuste/complemento)',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaInscricaoDto)
  respostas: RespostaInscricaoDto[];
}
