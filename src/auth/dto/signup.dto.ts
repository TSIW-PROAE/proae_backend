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
import { IsStrongPassword } from '../../validators/strong-password.validator';
import { IsUfbaEmail } from '../../validators/is-ufba-email.validator';

export class SignupDto {
  @ApiProperty({
    description: 'Matrícula do aluno',
    example: '202301234',
  })
  @IsNotEmpty()
  @IsNumberString()
  matricula: string;

  @ApiProperty({
    description: 'Email institucional do aluno (apenas @ufba.br)',
    example: 'aluno@ufba.br',
  })
  @IsNotEmpty()
  @IsUfbaEmail({
    message: 'Email deve ser do domínio @ufba.br',
  })
  email: string;

  @ApiProperty({
    description:
      'Senha do aluno (deve ser forte e não ter sido vazada anteriormente)',
    example: 'Kj9#mP2$vL8nQ4!',
  })
  @IsNotEmpty()
  @IsStrongPassword({
    message: 'Senha deve ser forte e não ter sido vazada anteriormente',
  })
  senha: string;

  @ApiProperty({
    description: 'Nome do aluno',
    example: 'João',
  })
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Sobrenome do aluno',
    example: 'Silva',
  })
  @IsNotEmpty()
  sobrenome: string;

  @ApiProperty({
    description: 'Pronome de tratamento do aluno',
    enum: PronomesEnum,
    example: PronomesEnum.ELE_DELE,
  })
  @IsNotEmpty()
  @IsEnum(PronomesEnum)
  pronome: PronomesEnum;

  @ApiProperty({
    description: 'Data de nascimento do aluno (formato: YYYY-MM-DD)',
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
    example: UnidadeEnum.VITORIA_CONQUISTA,
  })
  @IsNotEmpty()
  @IsEnum(UnidadeEnum)
  campus: UnidadeEnum;

  @ApiProperty({
    description: 'CPF do aluno (formato: XXX.XXX.XXX-XX)',
    example: '123.456.789-00',
  })
  @IsNotEmpty()
  @IsCPF()
  cpf: string;

  @ApiProperty({
    description: 'Semestre de ingresso do aluno (formato: YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @IsNotEmpty()
  data_ingresso: string;

  @ApiProperty({
    description: 'Número de celular do aluno (formato: +55DDDNUMERO)',
    example: '+5584999999999',
  })
  @IsNotEmpty()
  @IsPhoneNumber('BR')
  celular: string;
}
