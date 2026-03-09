import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    type: String,
    description: 'Email do usuário para recuperação de senha',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
