import {
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'A senha deve conter pelo menos uma letra, um número e um caractere especial',
  })
  senha: string;

}
