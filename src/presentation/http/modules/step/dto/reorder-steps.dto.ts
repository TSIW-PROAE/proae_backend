import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderStepItemDto {
  @ApiProperty({ description: 'ID do step' })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Nova posição (asc) do step dentro do edital' })
  @IsInt()
  @Min(0)
  ordem: number;
}

export class ReorderStepsDto {
  @ApiProperty({
    description: 'Lista completa (ou parcial) das novas posições.',
    type: [ReorderStepItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderStepItemDto)
  itens: ReorderStepItemDto[];
}
