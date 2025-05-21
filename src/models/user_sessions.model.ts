import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface IUserSession {
  user_id: Types.ObjectId;
  device_token: string;
  auth_token: string;
  device_type: 'ios' | 'android' | 'web';
  is_deleted: boolean;
}

export type UserSessionDocument = UserSession & Document;

@Schema({ timestamps: true, versionKey: false, collection: 'user_sessions' })
export class UserSession implements IUserSession {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user_id!: Types.ObjectId;

  @Prop({ required: true })
  device_token!: string;

  @Prop({ required: true })
  auth_token!: string;

  @Prop({ required: true, enum: ['ios', 'android', 'web'] })
  device_type!: 'ios' | 'android' | 'web';

  @Prop({ required: true, default: false })
  is_deleted: boolean = false;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
