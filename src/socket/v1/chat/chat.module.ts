import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { SocketConnectFunctions } from './functions/functions.connect';
import { User, UserSchema } from '../../../models/users.model';
import {
  UserSession,
  UserSessionSchema,
} from '../../../models/user_sessions.model';
import { ChatRoom, ChatRoomSchema } from '../../../models/chat_rooms.model';
import { Chat, ChatSchema } from '../../../models/chats.model';
import { ChatService } from './functions/functions.chat';
import { SocketAuthGuard } from '../../../common/guards/socket-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSession.name, schema: UserSessionSchema },
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('TOKEN_KEY'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ChatGateway,
    SocketConnectFunctions,
    ChatService,
    SocketAuthGuard,
  ],
  exports: [ChatGateway, SocketAuthGuard],
})
export class V1ChatModule {}
