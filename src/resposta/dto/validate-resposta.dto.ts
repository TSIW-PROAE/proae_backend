import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
  ValidateIf,
} from 'class-validator';
import { IsReenvioValid } from '../../validators/is-reenvio-valid.validator';

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
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  validada?: boolean;

  @ApiPropertyOptional({
    description: 'Marcar como invalidada',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  invalidada?: boolean;

  @ApiPropertyOptional({
    description: 'Parecer sobre a resposta',
    example: 'Documento precisa ser mais legível',
    required: false,
  })
  @ValidateIf((o) => o.requerReenvio === true)
  @IsString({ message: 'Parecer é obrigatório quando requerReenvio é true' })
  parecer?: string;

  @ApiPropertyOptional({
    description: 'Prazo para reenvio da resposta',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @ValidateIf((o) => o.requerReenvio === true)
  @IsDateString(
    {},
    { message: 'Prazo de reenvio é obrigatório quando requerReenvio é true' },
  )
  prazoReenvio?: string;

  @ApiPropertyOptional({
    description: 'Indica se a resposta requer reenvio/correção',
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @IsReenvioValid()
  requerReenvio?: boolean;
}
