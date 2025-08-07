import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../validators/strong-password.validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description:
      'Nova senha do usuário (deve ser forte e não ter sido vazada anteriormente)',
    example: 'Kj9#mP2$vL8nQ4!',
    required: true,
  })
  @IsNotEmpty()
  @IsStrongPassword({
    message: 'Senha deve ser forte e não ter sido vazada anteriormente',
  })
  senha: string;
}
