// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { UserRepository } from './repositories/auth.repositories';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../../models/users.model';
import {
  UserSession,
  UserSessionSchema,
} from '../../../models/user_sessions.model';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
})
export class AuthModule {}
