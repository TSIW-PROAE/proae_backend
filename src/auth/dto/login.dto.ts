import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsUfbaEmail } from '../../validators/is-ufba-email.validator';

export class LoginDto {
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
    description: 'Senha do usuário',
    example: 'Kj9#mP2$vL8nQ4!',
  })
  @IsNotEmpty()
  senha: string;
}
