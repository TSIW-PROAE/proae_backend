import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsEnum,
  IsDateString,
  IsPhoneNumber,
  Matches,
} from 'class-validator';
import { IsCPF } from '../../validators/isCpf.validator';
import { PronomesEnum } from '../../enum/enumPronomes';
import { CursosEnum } from '../../enum/enumCursos';
import { UnidadeEnum } from '../../enum/enumCampus';

export class SignupDto {
  @IsNotEmpty()
  @IsNumberString()
  matricula: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'A senha deve conter pelo menos uma letra, um número e um caractere especial',
  })
  senha: string;

  @IsNotEmpty()
  nome: string;

  @IsNotEmpty()
  sobrenome: string;

  @IsNotEmpty()
  @IsEnum(PronomesEnum)
  pronome: PronomesEnum;

  @IsNotEmpty()
  @IsDateString()
  data_nascimento: string;

  @IsNotEmpty()
  @IsEnum(CursosEnum)
  curso: CursosEnum;

  @IsNotEmpty()
  @IsEnum(UnidadeEnum)
  campus: UnidadeEnum;

  @IsNotEmpty()
  @IsCPF()
  cpf: string;

  @IsNotEmpty()
  @IsDateString()
  data_ingresso: string;

  @IsNotEmpty()
  @IsPhoneNumber('BR')
  celular: string;
}
