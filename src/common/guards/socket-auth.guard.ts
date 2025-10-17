import * as jwt from 'jsonwebtoken';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { Model, FilterQuery, Document } from 'mongoose';
import { Socket } from 'socket.io';
import { UserSession } from '../../models/user_sessions.model';
import { User } from '../../models/users.model';

interface AuthenticatedUser extends Document {
  _id: any;
  is_blocked_by_admin?: boolean;
  [key: string]: any;
}

interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedUser;
  };
}

@Injectable()
export class SocketAuthGuard {
  private readonly logger = new Logger(SocketAuthGuard.name);
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserSession.name)
    private readonly sessionModel: Model<UserSession>
  ) {}

  async use(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const bearerHeader: string = String(
        socket.handshake.headers['authorization'] || ''
      );
      if (!bearerHeader)
        return next(new Error('A token is required for authentication.'));

      const bearerToken: string = bearerHeader.startsWith('Bearer ')
        ? bearerHeader.split(' ')[1] || ''
        : bearerHeader || '';

      const findUserSession = await this.sessionModel.findOne({
        auth_token: bearerToken,
      });
      if (!findUserSession) return next(new Error('Authentication failed.'));

      const payload = jwt.verify(bearerToken, process.env.TOKEN_KEY as string, {
        issuer: process.env.TOKEN_ISSUER ?? 'pet-api',
        audience: process.env.TOKEN_AUDIENCE ?? 'pet-app',
      }) as { id: string };

      const filter: FilterQuery<User> = {
        _id: payload.id,
        is_deleted: false,
      };
      const user = await this.userModel.findOne(filter);
      if (!user) return next(new Error('Authentication failed.'));
      if (user.is_blocked_by_admin) {
        return next(new Error('Your account has been blocked by the admin.'));
      }

      socket.data = { user };

      return next();
    } catch (error: any) {
      this.logger.error(
        `SocketAuth middleware error: ${(error as Error)?.message || ''}`
      );
      return next(new Error('Authentication failed.'));
    }
  }
}

export const socketAuth = (guardInstance: SocketAuthGuard) =>
  guardInstance.use.bind(guardInstance);
