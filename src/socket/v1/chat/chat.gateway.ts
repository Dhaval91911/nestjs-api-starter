import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SocketConnectFunctions } from './functions/functions.connect';
import { ChatService } from './functions/functions.chat';
import { User } from '../../../models/users.model';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserSession } from '../../../models/user_sessions.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  SendMessageData,
  CreateRoomData,
  DeleteChatRoomData,
  ChangeScreenStatusData,
  ChatUserListData,
  EditMessageData,
  DeleteMessageData,
  ReadMessageData,
  GetAllMessageData,
  SetSocketIdData,
  CheckUserIsOnlineData,
} from './interfaces/chat.interfaces';
import { SocketAuthGuard } from '../../../common/guards/socket-auth.guard';
import { UseGuards, Logger } from '@nestjs/common';

export interface SocketData extends Socket {
  data: {
    user: {
      _id: string;
    };
  };
}

// Comma-separated list of allowed origins supplied via env (e.g. "https://app.com,https://admin.app.com")
const allowedOriginsEnv = process.env.CORS_ORIGINS ?? '';
if (!allowedOriginsEnv) {
  // Fail-fast: credentials:true with a wildcard is a security risk
  throw new Error(
    'CORS_ORIGINS environment variable must be set for WebSockets'
  );
}
const wsAllowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

// Security guard: disallow any wildcard origins when credentials are enabled.
if (wsAllowedOrigins.some((o) => o === '*' || o === '/*')) {
  throw new Error(
    'CORS_ORIGINS must not contain "*" when credentials are enabled'
  );
}

@UseGuards(SocketAuthGuard)
@WebSocketGateway({
  cors: {
    origin: wsAllowedOrigins,
    credentials: true,
  },
  namespace: 'v1',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly socketConnectFunctions: SocketConnectFunctions,
    private readonly chatService: ChatService,
    private readonly socketAuthGuard: SocketAuthGuard
  ) {}

  afterInit() {
    this.logger.log('✅ Socket server initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      await this.socketAuthGuard.use(socket, (err: any) => {
        if (err) {
          socket.emit('error', { message: 'Authentication failed.' });
        }
        this.logger.log(`User connected ${socket.id}`);
      });
    } catch (error: unknown) {
      this.logger.error(
        `connection error: ${error instanceof Error ? error.message : String(error)}`
      );
      socket.emit('error', { message: 'Authentication failed.' });
    }
  }

  async handleDisconnect(socket: Socket) {
    try {
      this.logger.log(`User disconnected ${socket.id}`);
      const data = { socket_id: socket.id };
      const disconnect_user =
        await this.socketConnectFunctions.disconnectSocket(data, this.server);

      if (disconnect_user.success) {
        this.server.emit('userIsOffline', disconnect_user);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Socket Disconnect Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('setSocketId')
  async handleSetSocketId(
    @MessageBody() data: SetSocketIdData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        socket_id: socket.id,
        user_id: socket.data.user._id,
      };
      this.logger.log(`setSocketId on :: ${JSON.stringify(data)}`);

      await socket.join(data.user_id.toString());

      const setSocketData = await this.socketConnectFunctions.setSocketId(data);
      socket.emit('setSocketId', setSocketData);

      const findUserOnline =
        await this.socketConnectFunctions.checkUserIsOnline(data);
      if (findUserOnline.success) {
        this.server.emit('userIsOnline', findUserOnline);
      }
    } catch (error: unknown) {
      this.logger.error(
        `Set Socket ID Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('checkUserIsOnline')
  async handleCheckUserIsOnline(
    @MessageBody() data: CheckUserIsOnlineData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      const result = await this.socketConnectFunctions.checkUserIsOnline(data);
      socket.emit('checkUserIsOnline', result);
    } catch (error: unknown) {
      this.logger.error(
        `Check User Online Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() data: CreateRoomData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };

      this.logger.log(`createRoom on :: ${JSON.stringify(data)}`);

      const createRoomData = await this.chatService.createRoom(data);
      socket.emit('createRoom', createRoomData);
    } catch (error) {
      this.logger.error(
        `createRoom Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: SendMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        sender_id: socket.data.user._id,
      };

      this.logger.log(`sendMessage on :: ${JSON.stringify(data)}`);

      const newMessage = await this.chatService.sendMessage(data);
      if (newMessage.success) {
        await socket.join(data.chat_room_id);
        this.server
          .to(data.chat_room_id.toString())
          .emit('sendMessage', newMessage);

        const senderChatListData = await this.chatService.updatedChatRoomData({
          user_id: data.sender_id,
          chat_room_id: data.chat_room_id,
        });
        this.server
          .to(data.sender_id.toString())
          .emit('updatedChatRoomData', senderChatListData);

        const receiverChatListData = await this.chatService.updatedChatRoomData(
          { user_id: data.receiver_id, chat_room_id: data.chat_room_id }
        );
        this.server
          .to(data.receiver_id.toString())
          .emit('updatedChatRoomData', receiverChatListData);
      } else {
        this.server
          .to(data.chat_room_id.toString())
          .emit('sendMessage', newMessage);
      }
    } catch (error) {
      this.logger.error(
        `sendMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('getAllMessage')
  async handleGetAllMessage(
    @MessageBody() data: GetAllMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`getAllMessage on :: ${JSON.stringify(data)}`);
      await socket.join(data.chat_room_id);

      const find_chats = await this.chatService.getAllMessage(data);
      socket.emit('getAllMessage', find_chats);
    } catch (error) {
      this.logger.error(
        `getAllMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody() data: EditMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`editMessage on :: ${JSON.stringify(data)}`);
      await socket.join(data.chat_room_id);

      const editMessageData = await this.chatService.editMessage(data);
      if (editMessageData.success) {
        this.server
          .to(data.chat_room_id.toString())
          .emit('editMessage', editMessageData);

        const { isLastMessage, sender_id, chat_room_id, receiver_id } =
          editMessageData.data as {
            isLastMessage: boolean;
            sender_id: string;
            chat_room_id: string;
            receiver_id: string;
          };

        if (isLastMessage) {
          const senderChatListData = await this.chatService.updatedChatRoomData(
            {
              user_id: sender_id,
              chat_room_id: chat_room_id,
            }
          );
          this.server
            .to(sender_id.toString())
            .emit('updatedChatRoomData', senderChatListData);

          const receiverChatListData =
            await this.chatService.updatedChatRoomData({
              user_id: receiver_id,
              chat_room_id: chat_room_id,
            });
          this.server
            .to(receiver_id.toString())
            .emit('updatedChatRoomData', receiverChatListData);
        }
      } else {
        socket.emit('editMessage', editMessageData);
      }
    } catch (error) {
      this.logger.error(
        `editMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() data: DeleteMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`deleteMessage on :: ${JSON.stringify(data)}`);
      await socket.join(data.chat_room_id.toString());

      const deleteMessageData = await this.chatService.deleteMessage(data);

      if (deleteMessageData.success) {
        this.server
          .to(data.chat_room_id.toString())
          .emit('deleteMessage', deleteMessageData);

        const userChatListData = await this.chatService.updatedChatRoomData({
          user_id: data.user_id,
          chat_room_id: data.chat_room_id,
        });
        this.server
          .to(data.user_id.toString())
          .emit('updatedChatRoomData', userChatListData);
      } else {
        socket.emit('deleteMessage', deleteMessageData);
      }
    } catch (error) {
      this.logger.error(
        `deleteMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('deleteMessageForEveryOne')
  async handleDeleteMessageForEveryone(
    @MessageBody() data: DeleteMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`deleteMessageForEveryOne on :: ${JSON.stringify(data)}`);
      await socket.join(data.chat_room_id.toString());

      const deleteMessageForEveryOneData =
        await this.chatService.deleteMessageForEveryone(data);

      if (deleteMessageForEveryOneData.success) {
        this.server
          .to(data.chat_room_id.toString())
          .emit('deleteMessageForEveryOne', deleteMessageForEveryOneData);

        const { isLastMessage, sender_id, chat_room_id, receiver_id } =
          deleteMessageForEveryOneData.data as {
            isLastMessage: boolean;
            sender_id: string;
            chat_room_id: string;
            receiver_id: string;
          };

        if (isLastMessage) {
          const senderChatListData = await this.chatService.updatedChatRoomData(
            { user_id: sender_id, chat_room_id: chat_room_id }
          );
          this.server
            .to(sender_id.toString())
            .emit('updatedChatRoomData', senderChatListData);

          const receiverChatListData =
            await this.chatService.updatedChatRoomData({
              user_id: receiver_id,
              chat_room_id: chat_room_id,
            });
          this.server
            .to(receiver_id.toString())
            .emit('updatedChatRoomData', receiverChatListData);
        }
      } else {
        socket.emit('deleteMessageForEveryOne', deleteMessageForEveryOneData);
      }
    } catch (error) {
      this.logger.error(
        `deleteMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('readMessage')
  async handleReadMessage(
    @MessageBody() data: ReadMessageData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`readMessage on :: ${JSON.stringify(data)}`);
      await socket.join(data.chat_room_id);

      const readMessages = await this.chatService.readMessage(data);
      this.server
        .to(data.chat_room_id.toString())
        .emit('readMessage', readMessages);

      const senderChatListData = await this.chatService.updatedChatRoomData({
        user_id: data.user_id,
        chat_room_id: data.chat_room_id,
      });
      this.server
        .to(data.user_id.toString())
        .emit('updatedChatRoomData', senderChatListData);
    } catch (error) {
      this.logger.error(
        `readMessage Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('chatUserList')
  async handleChatUserList(
    @MessageBody() data: ChatUserListData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };

      this.logger.log(`chatUserList on :: ${JSON.stringify(data)}`);
      await socket.join(data.user_id.toString());
      const result = await this.chatService.chatUserList(data);
      socket.emit('chatUserList', result);
    } catch (error) {
      this.logger.error(
        `chatUserList Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('deleteChatRoom')
  async handleDeleteChatRoom(
    @MessageBody() data: DeleteChatRoomData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
      };
      this.logger.log(`deleteChatRoom on :: ${JSON.stringify(data)}`);

      const deleteChatData = await this.chatService.deleteChatRoom(data);

      if (deleteChatData.success) {
        this.server
          .to(data.user_id.toString())
          .emit('deleteChatRoom', deleteChatData);
      } else {
        socket.emit('deleteChatRoom', deleteChatData);
      }
    } catch (error) {
      this.logger.error(
        `deleteChatRoom Error ON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @SubscribeMessage('changeScreenStatus')
  async handleChangeScreenStatus(
    @MessageBody() data: ChangeScreenStatusData,
    @ConnectedSocket() socket: SocketData
  ) {
    try {
      data = {
        ...data,
        user_id: socket.data.user._id,
        socket_id: socket.id,
      };
      this.logger.log(
        ` -----------  changeScreenStatus  -----------  ${JSON.stringify(data)}`
      );

      const change_screen_status =
        await this.chatService.changeScreenStatus(data);
      socket.emit('changeScreenStatus', change_screen_status);
    } catch (error) {
      this.logger.error(
        `=== changeScreenStatus === ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
