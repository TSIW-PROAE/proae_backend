import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { IsCPF } from '../../validators/isCpf.validator';
import { IsStrongPassword } from '../../validators/strong-password.validator';
import { IsUfbaEmail } from '../../validators/is-ufba-email.validator';

export class SignupDtoAdmin {
  @ApiProperty({
    description: 'Cargo do admin',
    example: 'Servidor do serviço social',
  })
  @IsNotEmpty()
  @IsString()
  cargo: string;

  @ApiProperty({
    description: 'Email institucional do admin (apenas @ufba.br)',
    example: 'aluno@ufba.br',
  })
  @IsNotEmpty()
  @IsUfbaEmail({
    message: 'Email deve ser do domínio @ufba.br',
  })
  email: string;

  @ApiProperty({
    description:
      'Senha do admin (deve ser forte e não ter sido vazada anteriormente)',
    example: 'Kj9#mP2$vL8nQ4!',
  })
  @IsNotEmpty()
  @IsStrongPassword({
    message: 'Senha deve ser forte e não ter sido vazada anteriormente',
  })
  senha: string;

  @ApiProperty({
    description: 'Nome do admin',
    example: 'Mariana Santos Souza',
  })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Data de nascimento do admin (formato: YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  data_nascimento: string;

  @ApiProperty({
    description: 'CPF do admin (formato: XXX.XXX.XXX-XX)',
    example: '123.456.789-09',
  })
  @IsNotEmpty()
  @IsCPF()
  cpf: string;

  @ApiProperty({
    description: 'Número de celular do admin (formato: +55DDDNUMERO)',
    example: '+5584999999999',
  })
  @IsNotEmpty()
  @IsPhoneNumber('BR')
  celular: string;
}
