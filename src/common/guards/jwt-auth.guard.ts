import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { IUser } from 'src/models/users.model';
import { User } from 'src/models/users.model';
import { UserSession } from 'src/models/user_sessions.model';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserSession.name)
    private readonly sessionModel: Model<UserSession>
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    interface RequestWithUser extends Request {
      user?: IUser & { token?: string };
    }
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    const authHeader: string = String(req.headers['authorization'] ?? '');
    if (!authHeader)
      throw new UnauthorizedException(
        'A token is required for authentication.'
      );

    const [, token] = authHeader.split(' ');
    if (!token) throw new UnauthorizedException('Authentication failed.');

    const session = await this.sessionModel.findOne({ auth_token: token });
    if (!session) throw new UnauthorizedException('Authentication failed.');

    const payload = jwt.verify(token, process.env.TOKEN_KEY as string, {
      issuer: process.env.TOKEN_ISSUER ?? 'pet-api',
      audience: process.env.TOKEN_AUDIENCE ?? 'pet-app',
    }) as {
      id: string;
    };

    const user = await this.userModel.findOne({
      _id: payload.id,
      is_deleted: false,
    });
    if (!user) throw new UnauthorizedException('Authentication failed.');
    if (user.is_blocked_by_admin)
      throw new ForbiddenException(
        'Your account has been blocked by the admin.'
      );
    req.user = user;
    req.user.token = token;

    return true;
  }
}
