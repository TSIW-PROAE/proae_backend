import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AdicionarAdminNotificacaoEmailDto {
  @ApiProperty({ example: 'coordenador@ufba.br' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty()
  email: string;
}
