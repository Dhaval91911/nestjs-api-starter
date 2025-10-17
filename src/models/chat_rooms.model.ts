import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IChatRoom {
  user_id: Types.ObjectId;
  other_user_id: Types.ObjectId;
  is_delete_by?: Types.ObjectId[];
  is_deleted?: boolean;
}

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true, versionKey: false })
export class ChatRoom implements IChatRoom {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  user_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  other_user_id!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'users' }], default: [] })
  is_delete_by?: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

// Ensure unique compound index so each pair of users has only one room
ChatRoomSchema.index({ user_id: 1, other_user_id: 1 }, { unique: true });
