import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateEtapasDto } from './create-etapas-edital.dto';

export class CreateEditalDto {
  @IsNotEmpty()
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
  categoria_edital?: string[];

  @IsNotEmpty()
  @IsString()
  status_edital: string;

  @IsNumber()
  quantidade_bolsas: number;

  @ValidateNested({ each: true })
  @Type(() => CreateEtapasDto)
  etapas: CreateEtapasDto[];
}
