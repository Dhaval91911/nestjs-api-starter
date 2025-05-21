// src/modules/users/users.module.ts
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { EmailService } from '../../../utils/email.utils';
import { UserRepository } from './repositories/users.repository';
import { User, UserSchema } from '../../../models/users.model';
import {
  UserSession,
  UserSessionSchema,
} from '../../../models/user_sessions.model';
import { AuthTokenMiddleware } from '../../../middlewares/auth-token.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UserService, UserRepository, EmailService],
  exports: [UserService, UserRepository],
})
export class UsersModule implements NestModule {
  private basePath = 'v1/admin';
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthTokenMiddleware).forRoutes(
      {
        path: `${this.basePath}/update_profile`,
        method: RequestMethod.PATCH,
      },
      {
        path: `${this.basePath}/change_password`,
        method: RequestMethod.POST,
      },
      {
        path: `${this.basePath}/delete_account`,
        method: RequestMethod.DELETE,
      },
      { path: `${this.basePath}/logout`, method: RequestMethod.POST },
      { path: `${this.basePath}/get_profile`, method: RequestMethod.GET },
      { path: `${this.basePath}/user_list`, method: RequestMethod.GET },
    );
  }
}
