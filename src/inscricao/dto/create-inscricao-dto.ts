import { IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer'; // necessário para a transformação de tipos
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

  @IsEnum(StatusInscricao)
  statusInscricao: StatusInscricao;

  @IsOptional()
  @IsNumber()
  formularioId?: number;

  @IsOptional()
  @IsArray({ each: true })
  documentos?: number[];
}
