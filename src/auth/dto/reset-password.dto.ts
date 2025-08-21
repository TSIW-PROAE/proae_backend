import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação de senha recebido no e-mail',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'O token é obrigatório' })
  token: string;

  @ApiProperty({
    description: 'Nova senha definida pelo usuário',
    example: 'NovaSenha123*!',
  })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'NovaSenha123*!',
  })
  @IsNotEmpty({ message: 'A confirmação da senha é obrigatória' })
  confirmPassword: string;
}
