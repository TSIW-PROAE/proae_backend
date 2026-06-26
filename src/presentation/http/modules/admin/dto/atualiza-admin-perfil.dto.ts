import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';

/** Body do PATCH /admin/:id/perfil — alteração feita por outro admin (gerencial). */
export class AtualizaAdminPerfilDto {
  @ApiProperty({
    description:
      'Novo perfil de acesso: tecnico, gerencial ou coordenacao.',
    enum: AdminPerfilEnum,
  })
  @IsEnum(AdminPerfilEnum, {
    message: 'perfil deve ser tecnico, gerencial ou coordenacao',
  })
  perfil: AdminPerfilEnum;
}
