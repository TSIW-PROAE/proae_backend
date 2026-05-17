import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CloneFormularioDto {
  @ApiProperty({
    description: 'ID do edital cujo formulário será copiado',
    example: 12,
  })
  @IsInt()
  @Min(1)
  edital_origem_id: number;

  @ApiPropertyOptional({
    description:
      'Se true, apaga o formulário existente do edital alvo antes de copiar.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  substituir_existente?: boolean;
}

export class CloneFormularioResponseDto {
  @ApiProperty({ example: 5 })
  stepsCriados: number;

  @ApiProperty({ example: 27 })
  perguntasCriadas: number;
}
