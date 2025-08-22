import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IUserSession {
  user_id: Types.ObjectId;
  user_type: 'user' | 'admin';
  device_token: string;
  device_type: 'ios' | 'android' | 'web';
  auth_token?: string;
  socket_id?: string | null;
  chat_room_id?: Types.ObjectId;
  is_login?: boolean;
  is_active?: boolean;
}

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true, versionKey: false })
export class UserSession implements IUserSession {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  user_id!: Types.ObjectId;

  @Prop({ type: String, enum: ['user', 'admin'], required: true })
  user_type!: 'user' | 'admin';

  @Prop({ type: String, required: true })
  device_token!: string;

  @Prop({ type: String, enum: ['ios', 'android', 'web'], required: true })
  device_type!: 'ios' | 'android' | 'web';

  @Prop({ type: String })
  auth_token?: string;

  @Prop({ type: String, default: null })
  socket_id?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'chat_rooms' })
  chat_room_id?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  is_login?: boolean;

  @Prop({ type: Boolean, default: true })
  is_active?: boolean;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
