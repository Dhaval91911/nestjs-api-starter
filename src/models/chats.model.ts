// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';

// export type FileType = 'image' | 'video';
// export type MessageType = 'text' | 'media';

// @Schema({ _id: false })
// export class MediaFileImage {
//   @Prop({ type: String, enum: ['image', 'video'], required: true })
//   file_type!: FileType;

//   @Prop({ type: String })
//   file_name?: string;

//   @Prop({ type: String })
//   file_path?: string;

//   @Prop({ type: String })
//   thumbnail?: string | null;
// }

// export const MediaFileImageSchema = SchemaFactory.createForClass(MediaFileImage);

// export interface IChat {
//   chat_room_id: Types.ObjectId;
//   sender_id: Types.ObjectId;
//   receiver_id: Types.ObjectId;
//   message_time?: Date;
//   message?: string;
//   message_type: MessageType;
//   media_file?: MediaFileImage[];
//   is_read?: boolean;
//   is_edited?: boolean;
//   is_delete_by?: Types.ObjectId[];
//   is_delete_everyone?: boolean;
// }

// export type ChatDocument = IChat & Document;

// @Schema({ timestamps: true, versionKey: false })
// export class Chat implements IChat {
//   @Prop({ type: Types.ObjectId, ref: 'chat_rooms', required: true })
//   chat_room_id!: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'users', required: true })
//   sender_id!: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'users', required: true })
//   receiver_id!: Types.ObjectId;

//   @Prop({ type: Date, default: Date.now })
//   message_time?: Date;

//   @Prop({ type: String })
//   message?: string;

//   @Prop({ type: String, enum: ['text', 'media'], required: true })
//   message_type!: MessageType;

//   @Prop({ type: [MediaFileImageSchema], default: [] })
//   media_file?: MediaFileImage[];

//   @Prop({ type: Boolean, default: false })
//   is_read?: boolean;

//   @Prop({ type: Boolean, default: false })
//   is_edited?: boolean;

//   @Prop({ type: [{ type: Types.ObjectId, ref: 'users' }], default: [] })
//   is_delete_by?: Types.ObjectId[];

//   @Prop({ type: Boolean, default: false })
//   is_delete_everyone?: boolean;
// }

// export const ChatSchema = SchemaFactory.createForClass(Chat);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IMediaFile {
  file_type: 'image' | 'video';
  file_name?: string;
  file_path?: string;
  thumbnail?: string | null;
}

export interface IChat {
  chat_room_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  receiver_id: Types.ObjectId;
  message_time: Date;
  message?: string;
  message_type: 'text' | 'media';
  media_file?: IMediaFile[];
  is_read: boolean;
  is_edited: boolean;
  is_delete_by: Types.ObjectId[];
  is_delete_everyone: boolean;
}

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'chats' })
export class Chat implements IChat {
  @Prop({ required: true, type: Types.ObjectId, ref: 'chat_rooms' })
  chat_room_id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  sender_id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'users' })
  receiver_id!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  message_time!: Date;

  @Prop({ type: String })
  message?: string;

  @Prop({ required: true, enum: ['text', 'media'] })
  message_type!: 'text' | 'media';

  @Prop({
    type: [
      {
        file_type: { type: String, enum: ['image', 'video'], required: true },
        file_name: String,
        file_path: String,
        thumbnail: { type: String, default: null },
      },
    ],
  })
  media_file?: IMediaFile[];

  @Prop({ type: Boolean, default: false })
  is_read: boolean = false;

  @Prop({ type: Boolean, default: false })
  is_edited: boolean = false;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'users' }], default: [] })
  is_delete_by!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  is_delete_everyone: boolean = false;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
