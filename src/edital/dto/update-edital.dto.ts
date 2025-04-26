import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateEditalDto {
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
}
