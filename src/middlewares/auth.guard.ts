import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../shared/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { User } from './../models/users.model';
import { AuthRequest } from '../common/Interfaces/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user: User = request.user;

    console.log({ user, requiredRoles });

    if (!user || !user.userType) {
      throw new ForbiddenException('Access denied');
    }

    if (!requiredRoles.includes(user.userType as Role)) {
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    request.user = user;
    return true;
  }
}
