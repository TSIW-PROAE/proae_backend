import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStepDto {
  @ApiProperty({ description: 'Texto descritivo do step', required: false })
  @IsOptional()
  @IsString()
  texto?: string;

  @ApiPropertyOptional({
    description: 'Nova posição relativa do step dentro do edital.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
