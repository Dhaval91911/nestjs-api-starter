import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { IUser } from 'src/models/users.model';

type RequestWithUser = Request & { user?: IUser };

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) throw new UnauthorizedException('Authentication required.');
    if (req.user.user_type !== 'admin') {
      throw new ForbiddenException('Admins only.');
    }
    return true;
  }
}

@Injectable()
export class UserOnlyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user) throw new UnauthorizedException('Authentication required.');
    if (req.user.user_type !== 'user') {
      throw new ForbiddenException('Users only.');
    }
    return true;
  }
}
