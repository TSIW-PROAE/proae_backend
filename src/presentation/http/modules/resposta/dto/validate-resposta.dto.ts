import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ValidateRespostaDto {
  @ApiPropertyOptional({
    description: 'Data de validade da resposta',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dataValidade?: string;

  @ApiPropertyOptional({
    description: 'Marcar como validada',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  validada?: boolean;

  @ApiPropertyOptional({ description: 'Marcar como invalidada' })
  @IsOptional()
  @IsBoolean()
  invalidada?: boolean;

  @ApiPropertyOptional({
    description: 'Se invalidada, permite reenvio pelo aluno',
  })
  @IsOptional()
  @IsBoolean()
  requerReenvio?: boolean;

  @ApiPropertyOptional({ description: 'Parecer ao invalidar ou pedir reenvio' })
  @IsOptional()
  @IsString()
  parecer?: string;

  @ApiPropertyOptional({
    description: 'Prazo limite para reenvio (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  prazoReenvio?: string;
}
