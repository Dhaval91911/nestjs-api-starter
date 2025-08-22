import { Module } from '@nestjs/common';
import { AppContentController } from './app_content.controller';
import { AppContentService } from './app_content.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AppContent, AppContentSchema } from 'src/models/app_contents.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppContent.name, schema: AppContentSchema },
    ]),
    AuthModule,
  ],
  controllers: [AppContentController],
  providers: [AppContentService],
  exports: [MongooseModule],
})
export class AppContentModule {}
