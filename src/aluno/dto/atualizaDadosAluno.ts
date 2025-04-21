import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';

export class AtualizaDadosAlunoDTO {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  sobrenome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsEnum(PronomesEnum)
  pronome?: PronomesEnum;

  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @IsOptional()
  @IsEnum(CursosEnum)
  curso?: CursosEnum;

  @IsOptional()
  @IsEnum(UnidadeEnum)
  campus?: UnidadeEnum;

  @IsOptional()
  @IsDateString()
  data_ingresso?: string;

  @IsOptional()
  @IsString()
  celular?: string;
}
