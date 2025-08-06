import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsPhoneNumber,
  Matches,
} from 'class-validator';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';
import { IsCPF } from '../../validators/isCpf.validator';

export class SignupDto {
  @ApiProperty({
    description: 'Matrícula do aluno',
    example: '202301234',
  })
  @IsNotEmpty()
  @IsNumberString()
  matricula: string;

  @ApiProperty({
    description: 'Email institucional do aluno',
    example: 'aluno@ufersa.edu.br',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do aluno (mínimo 8 caracteres, incluindo letras, números e caracteres especiais). Evite senhas comuns ou comprometidas.',
    example: 'MinhaSenh@Segura2024!',
  })
  @IsNotEmpty()
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
    {
      message:
        'A senha deve conter pelo menos uma letra, um número e um caractere especial e no mínimo 8 caracteres. Evite senhas comuns ou já comprometidas.',
    },
  )
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
    example: '123.456.789-09',
  })
  @IsNotEmpty()
  @IsCPF()
  cpf: string;

  @ApiProperty({
    description: 'Data de ingresso do aluno (formato: YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  data_ingresso: string;

  @ApiProperty({
    description: 'Número de celular do aluno (formato: +55DDDNUMERO)',
    example: '+5584999999999',
  })
  @IsNotEmpty()
  @IsPhoneNumber('BR')
  celular: string;
}
