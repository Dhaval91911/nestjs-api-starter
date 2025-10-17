import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationFor = 'test';

export interface INotification {
  sender_id: Types.ObjectId;
  receiver_id?: Types.ObjectId | null;
  receiver_ids?: Types.ObjectId[];
  noti_title: string;
  noti_msg?: string;
  noti_for?: NotificationFor;
  chat_room_id?: Types.ObjectId;
  chat_id?: Types.ObjectId;
  review_id?: Types.ObjectId;
  pet_id?: Types.ObjectId;
  service_id?: Types.ObjectId;
  community_id?: Types.ObjectId;
  noti_date?: Date;
  deleted_by_user?: Types.ObjectId[];
  is_read?: boolean;
  is_deleted?: boolean;
}

export type NotificationDocument = INotification & Document;

@Schema({ timestamps: true, versionKey: false })
export class Notification implements INotification {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  sender_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'users', default: null })
  receiver_id?: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'users', default: [] })
  receiver_ids?: Types.ObjectId[];

  @Prop({ type: String, required: true })
  noti_title!: string;

  @Prop({ type: String })
  noti_msg?: string;

  @Prop({
    type: String,
    enum: ['test'],
  })
  noti_for?: NotificationFor;

  @Prop({ type: Types.ObjectId, ref: 'chat_rooms' })
  chat_room_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'chats' })
  chat_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'user_reviews' })
  review_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'pets' })
  pet_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'services' })
  service_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'communities' })
  community_id?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, required: true })
  noti_date?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'users', default: [] })
  deleted_by_user?: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  is_read?: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Frequently fetched per receiver with read status ordered by recency
NotificationSchema.index({ receiver_id: 1, is_read: 1, createdAt: -1 });
