import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusInscricao } from '../../enum/enumStatusInscricao';

export class CreateInscricaoDto {
  @IsNotEmpty()
  @IsNumber()
  aluno: number;

  @IsNotEmpty()
  @IsNumber()
  edital: number;

  @IsDate()
  @Type(() => Date)
  data_inscricao: Date;

  @IsOptional()
  @IsEnum(StatusInscricao)
  status_inscricao?: StatusInscricao;

  @IsOptional()
  @IsNumber()
  formulario?: number;

  @IsOptional()
  @IsArray({ each: true })
  documentos: number[];
}
