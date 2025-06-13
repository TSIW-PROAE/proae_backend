import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';
import { ApiProperty } from '@nestjs/swagger';

export class AtualizaDadosAlunoDTO {
  @ApiProperty({
    description: 'Nome do aluno',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({
    description: 'Sobrenome do aluno',
    example: 'Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  sobrenome?: string;

  @ApiProperty({
    description: 'Email institucional do aluno',
    example: 'aluno@ufersa.edu.br',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Matrícula do aluno',
    example: '202301234',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  matricula?: string;

  @ApiProperty({
    description: 'Pronome de tratamento do aluno',
    enum: PronomesEnum,
    example: PronomesEnum.ELE_DELE,
  })
  @IsOptional()
  @IsEnum(PronomesEnum)
  pronome?: PronomesEnum;

  @ApiProperty({
    description: 'Data de nascimento do aluno (formato: YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiProperty({
    description: 'Curso do aluno',
    enum: CursosEnum,
    example: CursosEnum.CIENCIA_COMPUTACAO,
  })
  @IsOptional()
  @IsEnum(CursosEnum)
  curso?: CursosEnum;

  @ApiProperty({
    description: 'Campus do aluno',
    enum: UnidadeEnum,
    example: UnidadeEnum.VITORIA_CONQUISTA,
  })
  @IsOptional()
  @IsEnum(UnidadeEnum)
  campus?: UnidadeEnum;

  @ApiProperty({
    description: 'Data de ingresso do aluno (formato: YYYY-MM-DD)',
    example: '2023.1',
  })
  @IsOptional()
  @IsDateString()
  data_ingresso?: string;

  @ApiProperty({
    description: 'Número de celular do aluno (formato: +55DDDNUMERO)',
    example: '+5584999999999',
  })
  @IsOptional()
  @IsString()
  celular?: string;
}
