import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';

export class AtualizaAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Cargo na PROAE' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({
    required: false,
    description:
      'Perfil de acesso: tecnico, gerencial ou coordenacao. Apenas perfis gerenciais podem alterar este campo de outros usuários.',
    enum: AdminPerfilEnum,
  })
  @IsOptional()
  @IsEnum(AdminPerfilEnum, {
    message: 'perfil deve ser tecnico, gerencial ou coordenacao',
  })
  perfil?: AdminPerfilEnum;

  @ApiProperty({ required: false, example: '2000-01-01' })
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  celular?: string;
}
