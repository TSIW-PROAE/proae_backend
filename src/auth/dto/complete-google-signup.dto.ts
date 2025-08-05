import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsPhoneNumber,
} from 'class-validator';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';
import { IsCPF } from '../../validators/isCpf.validator';

export class CompleteGoogleSignupDto {
  @ApiProperty({
    description: 'Email do Google (readonly)',
    example: 'usuario@ufba.br',
  })
  email: string;

  @ApiProperty({
    description: 'Nome do usuário (vem do Google)',
    example: 'João',
  })
  nome: string;

  @ApiProperty({
    description: 'Sobrenome do usuário (vem do Google)',
    example: 'Silva',
  })
  sobrenome: string;

  @ApiProperty({
    description: 'Matrícula do aluno',
    example: '202301234',
  })
  @IsNotEmpty()
  @IsNumberString()
  matricula: string;

  @ApiProperty({
    description: 'Pronome de tratamento',
    enum: PronomesEnum,
    example: PronomesEnum.ELE_DELE,
  })
  @IsNotEmpty()
  @IsEnum(PronomesEnum)
  pronome: PronomesEnum;

  @ApiProperty({
    description: 'Data de nascimento (YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  data_nascimento: string;

  @ApiProperty({
    description: 'Curso do aluno',
    enum: CursosEnum,
    example: CursosEnum.CIENCIA_COMPUTACAO,
  })
  @IsNotEmpty()
  @IsEnum(CursosEnum)
  curso: CursosEnum;

  @ApiProperty({
    description: 'Campus do aluno',
    enum: UnidadeEnum,
    example: UnidadeEnum.SALVADOR,
  })
  @IsNotEmpty()
  @IsEnum(UnidadeEnum)
  campus: UnidadeEnum;

  @ApiProperty({
    description: 'CPF (XXX.XXX.XXX-XX)',
    example: '111.444.777-35',
  })
  @IsNotEmpty()
  @IsCPF()
  cpf: string;

  @ApiProperty({
    description: 'Semestre de ingresso (YYYY.S)',
    example: '2023.1',
  })
  @IsNotEmpty()
  data_ingresso: string;

  @ApiProperty({
    description: 'Celular (+55DDDNUMERO)',
    example: '+5584999999999',
  })
  @IsNotEmpty()
  @IsPhoneNumber('BR')
  celular: string;
}
