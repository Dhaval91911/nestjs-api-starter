import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IUserSession {
  user_id: Types.ObjectId;
  user_type: 'user' | 'admin';
  device_token: string;
  device_type: 'ios' | 'android' | 'web';
  auth_token?: string;
  refresh_token_hash?: string | null;
  refresh_token_expires_at?: Date | null;
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
  refresh_token_hash?: string | null;

  @Prop({ type: Date, default: null })
  refresh_token_expires_at?: Date | null;

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

// Compound index to speed up queries by user and active status
UserSessionSchema.index({ user_id: 1, is_active: 1 });
// Index to quickly look up by socket id
UserSessionSchema.index({ socket_id: 1 });
// Device token uniqueness per app installation
UserSessionSchema.index({ device_token: 1 });
// Quickly look up session via bearer token
UserSessionSchema.index({ auth_token: 1 });
// Auto-expire refresh tokens
UserSessionSchema.index(
  { refresh_token_expires_at: 1 },
  { expireAfterSeconds: 0 }
);
