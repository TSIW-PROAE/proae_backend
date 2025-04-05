import { IsEmail, IsNotEmpty, IsNumberString, Matches } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  @IsNumberString()
  registrationNumber: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'A senha deve conter pelo menos uma letra, um número e um caractere especial',
  })
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}
