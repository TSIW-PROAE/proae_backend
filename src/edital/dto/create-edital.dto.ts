import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateEtapasDto } from './create-etapas-edital.dto';

export class CreateEditalDto {
  @IsString()
  nome_edital: string;

  @IsString()
  descricao: string;

  @IsArray()
  @IsString({ each: true })
  tipo_beneficio: string[];

  @IsArray()
  @IsString({ each: true })
  edital_url: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoria_edital: string[];

  @IsString()
  status_edital: string;

  @IsNumber()
  quantidade_bolsas: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateEtapasDto)
  etapas: CreateEtapasDto[];
}
