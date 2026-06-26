import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderPerguntaItemDto {
  @ApiProperty({ description: 'ID da pergunta' })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Nova posição (asc) da pergunta dentro do step' })
  @IsInt()
  @Min(0)
  ordem: number;
}

export class ReorderPerguntasDto {
  @ApiProperty({
    description: 'Lista completa (ou parcial) das novas posições.',
    type: [ReorderPerguntaItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderPerguntaItemDto)
  itens: ReorderPerguntaItemDto[];
}
