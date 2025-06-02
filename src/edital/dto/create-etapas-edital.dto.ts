import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEtapasDto {
  @ApiProperty({ description: 'Nome da etapa' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Ordem da etapa' })
  @IsNumber()
  ordem: number;

  @ApiProperty({ description: 'Data de início da etapa' })
  @IsDate()
  @Type(() => Date)
  data_inicio: Date;

  @ApiProperty({ description: 'Data de fim da etapa' })
  @IsDate()
  @Type(() => Date)
  data_fim: Date;
}
