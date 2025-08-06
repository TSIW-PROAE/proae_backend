import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class SignInDto {
  @ApiProperty({
    description: 'Email institucional do aluno',
    example: 'aluno@ufersa.edu.br',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do aluno',
    example: 'MinhaSenh@Segura2024!',
  })
  @IsNotEmpty()
  senha: string;
}