import { SetMetadata } from '@nestjs/common';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';

export const ADMIN_PERFIS_KEY = 'admin_perfis';

/**
 * Restringe o handler aos perfis de admin informados. Use junto com
 * `JwtAuthGuard`, `RolesGuard` (com @Roles(RolesEnum.ADMIN)) e `AdminPerfisGuard`.
 *
 * Exemplo:
 *   @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
 *   @Roles(RolesEnum.ADMIN)
 *   @AdminPerfis(AdminPerfilEnum.GERENCIAL)
 */
export const AdminPerfis = (...perfis: AdminPerfilEnum[]) =>
  SetMetadata(ADMIN_PERFIS_KEY, perfis);
