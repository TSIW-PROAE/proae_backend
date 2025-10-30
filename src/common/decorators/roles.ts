import { SetMetadata } from '@nestjs/common';
import { RolesEnum as Role} from '@/src/enum/enumRoles';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);