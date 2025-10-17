import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UserSession } from '../../../../models/user_sessions.model';
import { ChatRoom } from '../../../../models/chat_rooms.model';
import { Chat, IMediaFile } from '../../../../models/chats.model';
import { User } from '../../../../models/users.model';
import { escapeRegex } from '../../../../common/regex.common';
import {
  socketErrorRes,
  socketSuccessRes,
} from '../../../../common/responses.common';
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
  UpdatedChatRoomData,
} from '../interfaces/chat.interfaces';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>
  ) {}

  async findChatRoom(chat_room_id: string) {
    const chatRoomData = await this.chatRoomModel.findOne({
      _id: chat_room_id,
      is_deleted: false,
    });

    return chatRoomData;
  }

  async createRoom(data: CreateRoomData) {
    const { user_id, other_user_id } = data;
    try {
      const userObjectId = new mongoose.Types.ObjectId(user_id);
      const otherUserObjectId = new mongoose.Types.ObjectId(other_user_id);

      const cond1 = {
        user_id: userObjectId,
        other_user_id: otherUserObjectId,
        is_deleted: false,
      };

      const cond2 = {
        user_id: otherUserObjectId,
        other_user_id: userObjectId,
        is_deleted: false,
      };

      const findRoom = await this.chatRoomModel.findOne({
        $or: [cond1, cond2],
      });

      let chat_room_id;

      if (findRoom) {
        chat_room_id = findRoom._id;

        const findChatDeleteByUser = await this.chatRoomModel.findOne({
          _id: findRoom._id,
          is_delete_by: { $eq: user_id },
        });

        if (findChatDeleteByUser) {
          await this.chatRoomModel.findByIdAndUpdate(
            findRoom._id,
            {
              $pull: { is_delete_by: user_id },
            },
            { new: true }
          );
        }
      } else {
        const createData = {
          user_id: userObjectId,
          other_user_id: otherUserObjectId,
        };

        const createNewRoom = await this.chatRoomModel.create(createData);
        chat_room_id = createNewRoom._id;
      }

      const [ChatRoomData] = await this.chatRoomModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        user_id: mongoose.Types.ObjectId;
        is_deleted: boolean;
        unread_count: number;
        profile_picture: string | null;
        is_online: boolean;
        full_name?: string;
        last_msg?: string;
        last_msg_time?: Date | null;
        last_msg_type?: string | null;
        createdAt: Date;
      }>([
        {
          $match: { _id: new mongoose.Types.ObjectId(chat_room_id) },
        },
        {
          $lookup: {
            from: 'chats',
            localField: '_id',
            foreignField: 'chat_room_id',
            as: 'chat_data',
          },
        },
        {
          $addFields: {
            other_user: {
              $cond: {
                if: { $eq: ['$user_id', userObjectId] },
                then: '$other_user_id',
                else: '$user_id',
              },
            },
            current_user: userObjectId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'other_user',
            foreignField: '_id',
            as: 'other_user_data',
          },
        },
        {
          $unwind: {
            path: '$other_user_data',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'user_albums',
            let: { localId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$localId'] },
                      { $eq: ['$album_type', 'image'] },
                    ],
                  },
                },
              },
            ],
            as: 'user_media',
          },
        },
        {
          $lookup: {
            from: 'chats',
            let: {
              roomId: '$_id',
              userId: new mongoose.Types.ObjectId(user_id),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                      { $eq: ['$is_delete_everyone', false] },
                      {
                        $or: [
                          { $eq: ['$sender_id', '$$userId'] },
                          { $eq: ['$receiver_id', '$$userId'] },
                        ],
                      },
                      { $ne: ['$is_delete_by', '$$userId'] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'last_message',
          },
        },
        {
          $unwind: {
            path: '$last_message',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'chats',
            let: { roomId: '$_id', userId: userObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $eq: ['$receiver_id', '$$userId'] },
                      { $ne: ['$is_read', true] },
                      { $eq: ['$is_delete_everyone', false] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                    ],
                  },
                },
              },
              { $count: 'unread_count' },
            ],
            as: 'unread_messages',
          },
        },
        {
          $addFields: {
            unread_count: {
              $ifNull: [
                {
                  $arrayElemAt: ['$unread_messages.unread_count', 0],
                },
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'user_sessions',
            let: { userId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$userId'] },
                      { $ne: ['$socket_id', null] },
                      { $eq: ['$is_active', true] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'online_status',
          },
        },
        {
          $addFields: {
            user_id: '$other_user_data._id',
            is_deleted: '$other_user_data.is_deleted',
            profile_picture: {
              $cond: {
                if: { $gt: [{ $size: '$user_media' }, 0] },
                then: {
                  $concat: [
                    process.env.BUCKET_URL,
                    { $arrayElemAt: ['$user_media.album_path', 0] },
                  ],
                },
                else: null,
              },
            },
            is_online: {
              $cond: {
                if: { $gt: [{ $size: '$online_status' }, 0] },
                then: true,
                else: false,
              },
            },
            full_name: '$other_user_data.full_name',
            last_msg: '$last_message.message',
            last_msg_time: { $ifNull: ['$last_message.message_time', null] },
            last_msg_type: { $ifNull: ['$last_message.message_type', null] },
          },
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            is_deleted: 1,
            unread_count: 1,
            profile_picture: 1,
            is_online: 1,
            full_name: 1,
            last_msg: 1,
            last_msg_time: 1,
            last_msg_type: 1,
            createdAt: 1,
          },
        },
      ]);

      return socketSuccessRes('Chat room created successfully', ChatRoomData);
    } catch (error: unknown) {
      this.logger.error(
        `createRoom Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async sendMessage(data: SendMessageData) {
    const {
      sender_id,
      chat_room_id,
      receiver_id,
      message,
      message_type,
      media_file,
    } = data;
    try {
      const currentDateTime = new Date();

      const senderObjectId = new mongoose.Types.ObjectId(sender_id);
      const findChatRoomExists = await this.findChatRoom(chat_room_id);

      if (!findChatRoomExists) {
        return socketErrorRes('Chat room not found', findChatRoomExists);
      }

      let insertData: {
        chat_room_id: mongoose.Types.ObjectId;
        sender_id: mongoose.Types.ObjectId;
        receiver_id: mongoose.Types.ObjectId;
        message_time: Date;
        message: string;
        is_read: boolean;
        message_type: string;
        media_file?: IMediaFile[];
      } = {
        chat_room_id: new mongoose.Types.ObjectId(chat_room_id),
        sender_id: new mongoose.Types.ObjectId(sender_id),
        receiver_id: new mongoose.Types.ObjectId(receiver_id),
        message_time: currentDateTime,
        message: message,
        is_read: false,
        message_type: message_type,
      };

      const media_file_array: IMediaFile[] = [];

      if (message_type === 'media') {
        if (media_file && media_file.length > 0) {
          for (const value of media_file) {
            let files: IMediaFile = {
              file_type: value.file_type,
              file_path: value.file_path,
              file_name: value.file_name,
            };

            if (value.file_type === 'video') {
              files = {
                ...files,
                thumbnail: value.thumbnail,
              };
            } else {
              files = {
                ...files,
                thumbnail: null,
              };
            }
            media_file_array.push(files);
          }
        }
      }

      if (media_file_array.length > 0) {
        insertData = {
          ...insertData,
          media_file: media_file_array,
        };
      }

      const receiverIsOnline = await this.userSessionModel.findOne({
        user_id: receiver_id,
        is_active: true,
        chat_room_id: chat_room_id,
      });

      if (receiverIsOnline) {
        insertData = {
          ...insertData,
          is_read: true,
        };
      }

      const createdChat = await this.chatModel.create(insertData);
      const findSender = (await this.userModel.findOne({
        _id: senderObjectId,
        is_deleted: false,
      })) as User;

      if (!findSender) {
        return socketErrorRes('Sender not find', null);
      }

      if (!receiverIsOnline) {
        // let noti_title = findSender.name;
        // let noti_msg = message_type === "media" ? `sent a media 🎥📸` : message;
        // let noti_for = "chat_notification";
        // let notiData: {
        //     noti_msg: string;
        //     noti_title: string;
        //     noti_for: string;
        //     chat_room_id: string;
        //     sender_id: string;
        //     device_token?: string[]; // Add this line
        // } = {
        //     noti_msg,
        //     noti_title,
        //     noti_for,
        //     chat_room_id: chat_room_id,
        //     sender_id: sender_id,
        // };
        // let findDeviceTokens = await this.userSessionModel.find({
        //     user_id: receiver_id,
        // });
        // let deviceTokenArray = findDeviceTokens.map((row) => row.device_token);
        // if (deviceTokenArray.length > 0) {
        //     notiData = { ...notiData, device_token: deviceTokenArray };
        //     console.log("noti sent topic");
        //     multiNotificationSend(notiData);
        // }
        // let inAppNotificationData = {
        //     sender_id: sender_id,
        //     receiver_id: receiver_id,
        //     chat_room_id: chat_room_id,
        //     noti_msg,
        //     noti_title,
        //     noti_for,
        // };
        // await notifications.create(inAppNotificationData);
      }

      const [findMessage] = await this.chatModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        chat_room_id: mongoose.Types.ObjectId;
        sender_id: mongoose.Types.ObjectId;
        receiver_id: mongoose.Types.ObjectId;
        message_time: Date;
        message?: string;
        message_type: 'text' | 'media';
        is_edited: boolean;
        media_file?: IMediaFile[];
        createdAt: Date;
        updatedAt: Date;
      }>([
        {
          $match: {
            _id: createdChat._id,
          },
        },
        {
          $addFields: {
            media_file: {
              $map: {
                input: '$media_file',
                as: 'media',
                in: {
                  $mergeObjects: [
                    '$$media',
                    {
                      file_path: {
                        $cond: [
                          { $ne: ['$$media.file_path', null] },
                          {
                            $concat: [
                              process.env.BUCKET_URL,
                              '$$media.file_path',
                            ],
                          },
                          '$$media.file_path',
                        ],
                      },
                      thumbnail: {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$$media.file_type', 'video'] },
                              { $ne: ['$$media.thumbnail', null] },
                            ],
                          },
                          {
                            $concat: [
                              process.env.BUCKET_URL,
                              '$$media.thumbnail',
                            ],
                          },
                          '$$media.thumbnail',
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            chat_room_id: 1,
            sender_id: 1,
            receiver_id: 1,
            message_time: 1,
            message: 1,
            message_type: 1,
            is_edited: 1,
            media_file: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      const findChatDeleteByUser = await this.chatRoomModel.findOne({
        _id: chat_room_id,
        $or: [
          { is_delete_by: { $eq: receiver_id } },
          { is_delete_by: { $eq: sender_id } },
        ],
      });

      if (findChatDeleteByUser) {
        await this.chatRoomModel.findByIdAndUpdate(
          chat_room_id,
          {
            $set: { is_delete_by: [] },
          },
          { new: true }
        );
      }

      return socketSuccessRes('Message sent successfully', findMessage);
    } catch (error) {
      this.logger.error(
        `sendMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async getAllMessage(data: GetAllMessageData) {
    const { chat_room_id, user_id, page = 1, limit = 10 } = data;
    try {
      const chatRoomObjectId = new mongoose.Types.ObjectId(chat_room_id);
      const userObjectId = new mongoose.Types.ObjectId(user_id);

      const findChatRoomExists = await this.findChatRoom(chat_room_id);

      if (!findChatRoomExists) {
        return socketErrorRes('Chat room not found', null);
      }

      const findAllMessages = await this.chatModel.aggregate([
        {
          $match: {
            chat_room_id: chatRoomObjectId,
            is_delete_everyone: false,
            is_delete_by: { $ne: userObjectId },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $addFields: {
            media_file: {
              $map: {
                input: '$media_file',
                as: 'media',
                in: {
                  $mergeObjects: [
                    '$$media',
                    {
                      file_path: {
                        $cond: [
                          { $ne: ['$$media.file_path', null] },
                          {
                            $concat: [
                              process.env.BUCKET_URL,
                              '$$media.file_path',
                            ],
                          },
                          '$$media.file_path',
                        ],
                      },
                      thumbnail: {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$$media.file_type', 'video'] },
                              { $ne: ['$$media.thumbnail', null] },
                            ],
                          },
                          {
                            $concat: [
                              process.env.BUCKET_URL,
                              '$$media.thumbnail',
                            ],
                          },
                          '$$media.thumbnail',
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            chat_room_id: 1,
            sender_id: 1,
            receiver_id: 1,
            message_time: 1,
            message: 1,
            message_type: 1,
            is_edited: 1,
            media_file: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return socketSuccessRes('Messages get successfully', findAllMessages);
    } catch (error) {
      this.logger.error(
        `getAllMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async editMessage(data: EditMessageData) {
    const { chat_id, chat_room_id, user_id, message } = data;
    try {
      const chatObjectId = new mongoose.Types.ObjectId(chat_id);
      const chatRoomObjectId = new mongoose.Types.ObjectId(chat_room_id);
      const userObjectId = new mongoose.Types.ObjectId(user_id);

      const find_message = await this.chatModel.findOne({ _id: chatObjectId });

      if (!find_message) {
        return socketErrorRes('Message not found', null);
      }

      if (find_message.sender_id.toString() !== userObjectId.toString()) {
        return socketErrorRes(
          'You do not have permission to edit this message',
          null
        );
      }

      await this.chatModel.updateOne(
        {
          _id: chatObjectId,
          chat_room_id: chatRoomObjectId,
          sender_id: userObjectId,
        },
        {
          $set: {
            message: message,
            is_edited: true,
          },
        }
      );

      const editedMessage = await this.chatModel.findOne({ _id: chatObjectId });

      const lastMessage = await this.chatModel
        .findOne({
          chat_room_id: chat_room_id,
        })
        .sort({
          createdAt: -1,
        });

      let isLastMessage = false;

      if (lastMessage?._id.toString() === editedMessage?._id.toString()) {
        isLastMessage = true;
      }

      return socketSuccessRes('Message edited successfully', {
        ...editedMessage?.toObject(),
        isLastMessage,
      });
    } catch (error) {
      this.logger.error(
        `editMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async deleteMessage(data: DeleteMessageData) {
    const { chat_room_id, chat_id, user_id } = data;
    try {
      const chatObjectId = new mongoose.Types.ObjectId(chat_id);

      const find_message = await this.chatModel.findOne({ _id: chatObjectId });

      if (!find_message) {
        return socketErrorRes('Message not found', null);
      }

      const delete_data = { is_delete_by: user_id };

      await this.chatModel
        .updateOne({ _id: find_message._id }, { $push: delete_data })
        .where({ is_delete_by: { $ne: user_id } });

      const updatedMessage = await this.chatModel.findOne({
        _id: chatObjectId,
      });

      if (updatedMessage && updatedMessage.message_type === 'media') {
        if (
          updatedMessage &&
          updatedMessage.media_file &&
          updatedMessage.media_file.length > 0 &&
          updatedMessage.is_delete_by.length === 2
        ) {
          // updatedMessage.media_file.map(async (media) => {
          //     try {
          //         if (media.file_type === "video") {
          //             await removeMediaFromS3Bucket(media.thumbnail_name);
          //         }
          //         let file_name = `socket_media/${media.file_name}`;
          //         await removeMediaFromS3Bucket(file_name);
          //     } catch (error) {
          //         console.log("failed to delete media from s3");
          //     }
          // });
        }
      }
      return socketSuccessRes('Chat deleted successfully', {
        chat_room_id: chat_room_id,
        chat_id: chat_id,
        user_id: user_id,
      });
    } catch (error) {
      this.logger.error(
        `deleteMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async deleteMessageForEveryone(data: DeleteMessageData) {
    const { chat_room_id, chat_id, user_id } = data;
    try {
      const chatObjectId = new mongoose.Types.ObjectId(chat_id);

      const findMessageData = await this.chatModel.findOne({
        _id: chatObjectId,
      });

      if (!findMessageData) {
        return socketErrorRes('Message not found', null);
      }

      if (findMessageData.sender_id.toString() !== user_id.toString()) {
        return socketErrorRes(
          'You do not have permission to delete this message',
          null
        );
      }

      await this.chatModel.updateOne(
        { _id: findMessageData._id },
        { $set: { is_delete_everyone: true } }
      );

      const updatedMessage = await this.chatModel.findOne({
        _id: chatObjectId,
      });

      if (updatedMessage && updatedMessage.message_type === 'media') {
        this.logger.log(
          `deleteMessageForEveryone media check: ${
            updatedMessage && updatedMessage.message_type === 'media'
          }`
        );
        if (
          updatedMessage &&
          updatedMessage.media_file &&
          updatedMessage.media_file.length > 0 &&
          updatedMessage.is_delete_everyone === true
        ) {
          // updatedMessage.media_file.map(async (media) => {
          //     try {
          //         if (media.file_type === "video") {
          //             await removeMediaFromS3Bucket(media.thumbnail_name);
          //         }
          //         let file_name = `socket_media/${media.file_name}`;
          //         await removeMediaFromS3Bucket(file_name);
          //     } catch (error) {
          //         console.log("failed to delete media from s3");
          //     }
          // });
        }
      }

      const lastMessage = await this.chatModel
        .findOne({
          chat_room_id: chat_room_id,
        })
        .sort({
          createdAt: -1,
        });

      let isLastMessage = false;

      if (lastMessage?._id.toString() === updatedMessage?._id.toString()) {
        isLastMessage = true;
      }

      return socketSuccessRes('Chat deleted successfully', {
        ...updatedMessage?.toObject(),
        isLastMessage,
      });
    } catch (error) {
      this.logger.error(
        `deleteMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async readMessage(data: ReadMessageData) {
    const { chat_room_id, user_id } = data;
    try {
      const chatRoomObjectId = new mongoose.Types.ObjectId(chat_room_id);
      const userObjectId = new mongoose.Types.ObjectId(user_id);

      await this.chatModel.updateMany(
        {
          chat_room_id: chatRoomObjectId,
          receiver_id: userObjectId,
          is_read: false,
        },
        {
          $set: {
            is_read: true,
          },
        }
      );

      return socketSuccessRes('Messages read successfully', { chat_room_id });
    } catch (error) {
      this.logger.error(
        `readMessage Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async chatUserList(data: ChatUserListData) {
    const { user_id, search = '', page = 1, limit = 10 } = data;
    try {
      const escapedSearch = search ? escapeRegex(search) : null;

      const userObjectId = new mongoose.Types.ObjectId(user_id);

      const matchCondition = {
        $or: [{ user_id: userObjectId }, { other_user_id: userObjectId }],
        is_delete_by: { $ne: new mongoose.Types.ObjectId(user_id) },
        is_deleted: false,
      };

      const findAllRooms = await this.chatRoomModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $lookup: {
            from: 'chats',
            localField: '_id',
            foreignField: 'chat_room_id',
            as: 'chat_data',
          },
        },
        {
          $match: {
            $expr: { $gt: [{ $size: '$chat_data' }, 0] },
          },
        },
        {
          $addFields: {
            other_user: {
              $cond: {
                if: { $eq: ['$user_id', userObjectId] },
                then: '$other_user_id',
                else: '$user_id',
              },
            },
            current_user: userObjectId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'other_user',
            foreignField: '_id',
            as: 'other_user_data',
          },
        },
        {
          $unwind: {
            path: '$other_user_data',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'user_albums',
            let: { localId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$localId'] },
                      { $eq: ['$album_type', 'image'] },
                    ],
                  },
                },
              },
            ],
            as: 'user_media',
          },
        },
        {
          $match: escapedSearch
            ? {
                'other_user_data.full_name': {
                  $regex: escapedSearch,
                  $options: 'i',
                },
              }
            : {},
        },
        {
          $lookup: {
            from: 'chats',
            let: {
              roomId: '$_id',
              userId: new mongoose.Types.ObjectId(user_id),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                      { $eq: ['$is_delete_everyone', false] },
                      {
                        $or: [
                          { $eq: ['$sender_id', '$$userId'] },
                          { $eq: ['$receiver_id', '$$userId'] },
                        ],
                      },
                      { $ne: ['$is_delete_by', '$$userId'] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'last_message',
          },
        },
        {
          $unwind: {
            path: '$last_message',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'chats',
            let: { roomId: '$_id', userId: userObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $eq: ['$receiver_id', '$$userId'] },
                      { $ne: ['$is_read', true] },
                      { $eq: ['$is_delete_everyone', false] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                    ],
                  },
                },
              },
              { $count: 'unread_count' },
            ],
            as: 'unread_messages',
          },
        },
        {
          $addFields: {
            unread_count: {
              $ifNull: [
                {
                  $arrayElemAt: ['$unread_messages.unread_count', 0],
                },
                0,
              ],
            },
          },
        },
        {
          $sort: {
            'last_message.message_time': -1,
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'user_sessions',
            let: { userId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$userId'] },
                      { $ne: ['$socket_id', null] },
                      { $eq: ['$is_active', true] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'online_status',
          },
        },
        {
          $addFields: {
            user_id: '$other_user_data._id',
            is_deleted: '$other_user_data.is_deleted',
            profile_picture: {
              $cond: {
                if: { $gt: [{ $size: '$user_media' }, 0] },
                then: {
                  $concat: [
                    process.env.BUCKET_URL,
                    { $arrayElemAt: ['$user_media.album_path', 0] },
                  ],
                },
                else: null,
              },
            },
            is_online: {
              $cond: {
                if: { $gt: [{ $size: '$online_status' }, 0] },
                then: true,
                else: false,
              },
            },
            full_name: '$other_user_data.full_name',
            last_msg: '$last_message.message',
            last_msg_time: { $ifNull: ['$last_message.message_time', null] },
            last_msg_type: { $ifNull: ['$last_message.message_type', null] },
          },
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            is_deleted: 1,
            unread_count: 1,
            profile_picture: 1,
            is_online: 1,
            full_name: 1,
            last_msg: 1,
            last_msg_time: 1,
            last_msg_type: 1,
            createdAt: 1,
          },
        },
      ]);

      return socketSuccessRes('User list get successfully', findAllRooms);
    } catch (error) {
      this.logger.error(
        `chatUserList Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async updatedChatRoomData(data: UpdatedChatRoomData) {
    const { user_id, chat_room_id } = data;
    try {
      const userObjectId = new mongoose.Types.ObjectId(user_id);
      const chatRoomObjectId = new mongoose.Types.ObjectId(chat_room_id);

      const matchCondition = {
        _id: chatRoomObjectId,
        is_deleted: false,
      };

      const [findRoom] = await this.chatRoomModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        user_id: mongoose.Types.ObjectId;
        is_deleted: boolean;
        unread_count: number;
        profile_picture: string | null;
        is_online: boolean;
        full_name?: string;
        last_msg?: string;
        last_msg_time?: Date | null;
        last_msg_type?: string | null;
        createdAt: Date;
      }>([
        {
          $match: matchCondition,
        },
        {
          $lookup: {
            from: 'chats',
            localField: '_id',
            foreignField: 'chat_room_id',
            as: 'chat_data',
          },
        },
        {
          $addFields: {
            other_user: {
              $cond: {
                if: { $eq: ['$user_id', userObjectId] },
                then: '$other_user_id',
                else: '$user_id',
              },
            },
            current_user: userObjectId,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'other_user',
            foreignField: '_id',
            as: 'other_user_data',
          },
        },
        {
          $unwind: {
            path: '$other_user_data',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'user_albums',
            let: { localId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$localId'] },
                      { $eq: ['$album_type', 'image'] },
                    ],
                  },
                },
              },
            ],
            as: 'user_media',
          },
        },
        {
          $lookup: {
            from: 'chats',
            let: {
              roomId: '$_id',
              userId: new mongoose.Types.ObjectId(user_id),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                      { $eq: ['$is_delete_everyone', false] },
                      {
                        $or: [
                          { $eq: ['$sender_id', '$$userId'] },
                          { $eq: ['$receiver_id', '$$userId'] },
                        ],
                      },
                      { $ne: ['$is_delete_by', '$$userId'] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'last_message',
          },
        },
        {
          $unwind: {
            path: '$last_message',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'chats',
            let: { roomId: '$_id', userId: userObjectId },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chat_room_id', '$$roomId'] },
                      { $eq: ['$receiver_id', '$$userId'] },
                      { $ne: ['$is_read', true] },
                      { $eq: ['$is_delete_everyone', false] },
                      { $not: { $in: [userObjectId, '$is_delete_by'] } },
                    ],
                  },
                },
              },
              { $count: 'unread_count' },
            ],
            as: 'unread_messages',
          },
        },
        {
          $addFields: {
            unread_count: {
              $ifNull: [
                {
                  $arrayElemAt: ['$unread_messages.unread_count', 0],
                },
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'user_sessions',
            let: { userId: '$other_user_data._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$user_id', '$$userId'] },
                      { $ne: ['$socket_id', null] },
                      { $eq: ['$is_active', true] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'online_status',
          },
        },
        {
          $addFields: {
            user_id: '$other_user_data._id',
            is_deleted: '$other_user_data.is_deleted',
            profile_picture: {
              $cond: {
                if: { $gt: [{ $size: '$user_media' }, 0] },
                then: {
                  $concat: [
                    process.env.BUCKET_URL,
                    { $arrayElemAt: ['$user_media.album_path', 0] },
                  ],
                },
                else: null,
              },
            },
            // is_online: { $gt: [{ $size: "$online_status" }, 0] },
            is_online: {
              $cond: {
                if: { $gt: [{ $size: '$online_status' }, 0] },
                then: true,
                else: false,
              },
            },
            full_name: '$other_user_data.full_name',
            last_msg: '$last_message.message',
            last_msg_time: { $ifNull: ['$last_message.message_time', null] },
            last_msg_type: { $ifNull: ['$last_message.message_type', null] },
          },
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            is_deleted: 1,
            unread_count: 1,
            profile_picture: 1,
            is_online: 1,
            full_name: 1,
            last_msg: 1,
            last_msg_time: 1,
            last_msg_type: 1,
            createdAt: 1,
          },
        },
      ]);

      return socketSuccessRes('User list get successfully', findRoom);
    } catch (error) {
      this.logger.error(
        `chatUserList Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async deleteChatRoom(data: DeleteChatRoomData) {
    const { chat_room_id, user_id } = data;
    try {
      const chatRoomObjectId = new mongoose.Types.ObjectId(chat_room_id);

      const findChatRoomExists = await this.findChatRoom(chat_room_id);

      if (!findChatRoomExists) {
        return socketErrorRes('Chat room not found', null);
      }

      const delete_data = { is_delete_by: user_id };

      await this.chatModel
        .updateMany({ chat_room_id: chat_room_id }, { $push: delete_data })
        .where({ is_delete_by: { $ne: user_id } });

      await this.chatRoomModel
        .updateOne({ _id: chatRoomObjectId }, { $push: delete_data })
        .where({ is_delete_by: { $ne: user_id } });

      return socketSuccessRes('Chat deleted successfully', { chat_room_id });
    } catch (error) {
      this.logger.error(
        `deleteChatRoom Error EMIT: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Something went wrong!');
    }
  }

  async changeScreenStatus(data: ChangeScreenStatusData) {
    const { user_id, screen_status, chat_room_id, socket_id } = data;
    try {
      const find_chat_room = await this.chatRoomModel.findOne({
        _id: chat_room_id,
        is_deleted: false,
      });

      if (!find_chat_room) {
        return socketErrorRes('Chat room not found', null);
      }

      if (screen_status === true) {
        await this.userSessionModel.updateOne(
          {
            user_id: user_id,
            socket_id: socket_id,
          },
          {
            $set: {
              chat_room_id: chat_room_id,
            },
          },
          { new: true }
        );
      } else {
        await this.userSessionModel.updateOne(
          {
            user_id: user_id,
            socket_id: socket_id,
          },
          {
            $set: {
              chat_room_id: null,
            },
          },
          { new: true }
        );
      }

      return socketSuccessRes('Screen status changed successfully', []);
    } catch (error) {
      this.logger.error(
        `changeScreenStatus Error: ${error instanceof Error ? error.message : String(error)}`
      );
      return socketErrorRes('Error in changeScreenStatus');
    }
  }
}
