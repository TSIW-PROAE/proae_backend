import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { UnidadeEnum } from '../../enum/enumCampus';

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
    description: 'Data de nascimento do aluno (formato: YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiProperty({
    description: 'Curso do aluno',
    example: 'Ciência da Computação',
  })
  @IsOptional()
  @IsString()
  curso?: string;

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
