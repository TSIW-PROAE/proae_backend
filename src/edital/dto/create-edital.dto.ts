import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateEtapasDto } from './create-etapas-edital.dto';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

export class CreateEditalDto {
  @IsNotEmpty()
  @IsEnum(EditalEnum)
  tipo_edital: EditalEnum;

  @IsString()
  descricao: string;

  @IsArray()
  @IsString({ each: true })
  edital_url: string[];

  @IsString()
  titulo_edital: string;

  @IsEnum(StatusEdital)
  status_edital: StatusEdital;

  @IsNumber()
  quantidade_bolsas: number;

  @ValidateNested({ each: true })
  @Type(() => CreateEtapasDto)
  etapas: CreateEtapasDto[];
}
