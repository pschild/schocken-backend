import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorator/permission.decorator';
import { Permission } from '../model/permission.enum';

@Injectable()
export class PermissionGuard implements CanActivate {

  constructor(private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    const user = context.switchToHttp().getRequest().user;
    return requiredPermissions && Array.isArray(requiredPermissions)
      ? requiredPermissions.every(permission => user.permissions.includes(permission))
      : true;
  }
}
