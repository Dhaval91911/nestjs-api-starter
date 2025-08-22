import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from 'src/models/users.model';
import { UserSession, UserSessionSchema } from 'src/models/user_sessions.model';
import {
  EmailVerification,
  EmailVerificationSchema,
} from 'src/models/email_verifications.model';
import { Guest, GuestSchema } from 'src/models/guests.model';
import { UserAlbum, UserAlbumSchema } from 'src/models/user_albums.model';
import { BucketUtil } from 'src/utils/bucket.util';
import { s3ClientProvider } from 'src/config/bucket.config';
import {
  Notification,
  NotificationSchema,
} from 'src/models/notifications.model';
import { UserOnlyGuard } from 'src/common/guards/role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: Guest.name, schema: GuestSchema },
      { name: UserAlbum.name, schema: UserAlbumSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, BucketUtil, s3ClientProvider, UserOnlyGuard],
})
export class UserModule {}
