import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { User, UserSchema } from 'src/models/users.model';
import { UserSession, UserSessionSchema } from 'src/models/user_sessions.model';
import {
  EmailVerification,
  EmailVerificationSchema,
} from 'src/models/email_verifications.model';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from 'src/common/guards/role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
    ]),
  ],
  providers: [AuthService, JwtAuthGuard, AdminOnlyGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard, AdminOnlyGuard, MongooseModule],
})
export class AuthModule {}
