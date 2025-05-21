import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppContentService } from './app-content.service';
import { AppContentController } from './app-content.controller';
import { AuthTokenMiddleware } from '../../../middlewares/auth-token.middleware';
import { User, UserSchema } from '../../../models/users.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AppContentService],
  controllers: [AppContentController],
})
export class AppContentModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthTokenMiddleware).forRoutes('admin/app-content');
  }
}
