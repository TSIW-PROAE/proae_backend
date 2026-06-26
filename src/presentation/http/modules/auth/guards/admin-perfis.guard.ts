import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERFIS_KEY } from 'src/common/decorators/admin-perfis';
import {
  AdminPerfilEnum,
  resolveAdminPerfilEfetivo,
} from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';

/**
 * Bloqueia o handler quando o admin autenticado não possui um dos perfis
 * exigidos por `@AdminPerfis(...)`.
 *
 * Considerações:
 * - Se o decorator não estiver presente, o guard libera (permite que o handler
 *   seja protegido apenas por `RolesGuard`).
 * - Aceita usuários sem coluna `perfil` (legado): assume `gerencial`.
 * - Sem role `admin` => Forbidden (a ideia é que rotas com este guard sejam
 *   exclusivamente administrativas; o `RolesGuard` já deve barrar antes).
 */
@Injectable()
export class AdminPerfisGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPerfilEnum[]>(
      ADMIN_PERFIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    if (!roles.includes(RolesEnum.ADMIN)) {
      throw new ForbiddenException(
        'Apenas servidores PROAE têm acesso a este recurso.',
      );
    }

    const perfilEfetivo = resolveAdminPerfilEfetivo(user?.adminPerfil);
    if (!required.includes(perfilEfetivo)) {
      throw new ForbiddenException(
        'Seu perfil de acesso não permite executar esta ação.',
      );
    }

    return true;
  }
}
