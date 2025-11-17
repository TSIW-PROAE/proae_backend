import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

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
}
