import { Module } from '@nestjs/common';
import { ChatGateway } from '../socket/chat/chat.gateway';
import { AdminModule as V1AdminModule } from 'src/v1/admin/admin.module';
import { ApplicationModule as V1AppModule } from 'src/v1/app/app.module';
import { AppContentController } from './app-content/app-content.controller';

@Module({
  imports: [V1AdminModule, V1AppModule],
  controllers: [AppContentController],
  providers: [ChatGateway],
})
export class AppModule {}
