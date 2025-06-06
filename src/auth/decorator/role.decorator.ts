import { SetMetadata } from '@nestjs/common';
import { Role } from '../model/role.enum';

export const ROLES_KEY = 'hoptimisten/roles';
export const Roles = (roles: Role[]) => SetMetadata(ROLES_KEY, roles);
