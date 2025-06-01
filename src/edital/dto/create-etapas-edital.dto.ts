import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEtapasDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNumber()
  ordem: number;

  @IsDate()
  @Type(() => Date)
  data_inicio: Date;

  @IsDate()
  @Type(() => Date)
  data_fim: Date;
}
