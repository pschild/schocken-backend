import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/role.decorator';
import { Role } from '../model/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const user = context.switchToHttp().getRequest().user;
    return requiredRoles && Array.isArray(requiredRoles)
      ? requiredRoles.every(role => user.roles.includes(role))
      : true;
  }
}
