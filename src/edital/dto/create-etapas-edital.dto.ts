import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEtapasDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsString()
  descricao: string;

  @IsNumber()
  ordem: number;

  @IsDate()
  @Type(() => Date)
  data_inicio: Date;

  @IsDate()
  @Type(() => Date)
  data_fim: Date;

  @IsOptional()
  @IsString()
  descricao_etapa?: string;
}
