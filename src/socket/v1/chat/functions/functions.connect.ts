import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../../models/users.model';
import { UserSession } from '../../../../models/user_sessions.model';
import { ChatRoom } from '../../../../models/chat_rooms.model';
import { Server } from 'socket.io';
import {
  socketErrorRes,
  socketSuccessRes,
} from '../../../../common/responses.common';

@Injectable()
export class SocketConnectFunctions {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>
  ) {}

  async setSocketId(data: {
    user_id: string;
    device_token: string;
    socket_id: string;
  }) {
    try {
      const { user_id, device_token, socket_id } = data;

      const user = await this.userModel.findOne({
        _id: user_id,
        is_deleted: false,
      });

      if (user) {
        await this.userSessionModel.updateOne(
          {
            user_id: user_id,
            device_token: device_token,
          },
          {
            $set: {
              socket_id: socket_id,
              is_active: true,
            },
          },
          {
            new: true,
          }
        );

        return socketSuccessRes('Socket id set successfully!', data);
      } else {
        return socketErrorRes('User not found!', null);
      }
    } catch (error: any) {
      console.log('setSocketId error', error);
      return socketErrorRes('Something went wrong', error);
    }
  }

  async disconnectSocket(data: { socket_id: string }, server: Server) {
    try {
      const { socket_id } = data;

      const findUserSession = await this.userSessionModel.findOne({
        socket_id: socket_id,
      });

      if (findUserSession) {
        const findUser = await this.userModel.findOne({
          _id: findUserSession.user_id,
          is_deleted: false,
        });

        if (findUser) {
          const user_id = findUser._id;
          await this.userSessionModel.updateOne(
            {
              _id: findUserSession._id,
            },
            {
              $set: {
                is_active: false,
                socket_id: null,
                chat_room_id: null,
              },
            },
            { new: true }
          );

          if (findUserSession.chat_room_id) {
            const findChatRoom = await this.chatRoomModel.findOne({
              _id: findUserSession.chat_room_id,
              is_deleted: false,
            });

            if (findChatRoom) {
              const userIsOnlineInChatRoom = await this.userSessionModel.find({
                user_id: findUser._id,
                chat_room_id: findChatRoom._id,
                socket_id: { $ne: socket_id },
                is_active: true,
              });

              if (userIsOnlineInChatRoom.length === 0) {
                const changeStatusData = {
                  chat_room_id: findChatRoom._id,
                  screen_status: false,
                  user_id: findUser._id,
                  socket_id: socket_id,
                };

                server
                  .to(findChatRoom._id.toString())
                  .emit('changeScreenStatus', {
                    success: true,
                    data: changeStatusData,
                  });
              }
            }
          }

          const userIsOnline = await this.userSessionModel.find({
            user_id: findUser._id,
            is_active: true,
          });

          if (userIsOnline.length === 0) {
            await this.userModel.updateOne(
              {
                _id: findUser._id,
              },
              {
                $set: {
                  is_online: false,
                },
              },
              { new: true }
            );

            return socketSuccessRes('User is offline', { user_id });
          } else {
            return socketErrorRes('User is online in other device', {
              user_id,
            });
          }
        } else {
          return socketErrorRes('User not found', null);
        }
      } else {
        return socketErrorRes('User session not found', null);
      }
    } catch (error: any) {
      console.log('error', error || 'Unknown error');
      return socketErrorRes('Something went wrong', error);
    }
  }

  async checkUserIsOnline(data: { user_id: string }) {
    try {
      const { user_id } = data;

      const findUser = await this.userModel.findOne({
        _id: user_id,
        is_deleted: false,
      });

      if (findUser) {
        const userIsOnline = await this.userSessionModel.find({
          user_id: findUser._id,
          is_active: true,
        });

        if (userIsOnline.length > 0) {
          return socketSuccessRes('User is online', { user_id });
        } else {
          return socketSuccessRes('User is offline', { user_id });
        }
      } else {
        return socketErrorRes('User not found', null);
      }
    } catch (error: any) {
      console.log('error', error);
      return socketErrorRes('Something went wrong', error);
    }
  }
}
