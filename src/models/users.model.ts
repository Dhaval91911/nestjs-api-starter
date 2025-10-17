import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Location {
  @Prop({ type: String, default: 'Point' })
  type!: string;

  @Prop({ type: [Number], required: true })
  coordinates!: number[]; // [longitude, latitude]
}

export const LocationSchema = SchemaFactory.createForClass(Location);

export interface IUser {
  user_type: 'user' | 'admin';
  full_name?: string;
  email_address: string;
  mobile_number?: number;
  country_code?: string;
  country_string_code?: string;
  password?: string | null;
  is_social_login?: boolean;
  social_id?: string | null;
  social_platform?: 'google' | 'facebook' | 'apple' | null;
  notification_badge?: number;
  location?: Location;
  address?: string;
  customer_id?: string;
  is_user_verified?: boolean;
  is_blocked_by_admin?: boolean;
  is_deleted?: boolean;
}

export type UserDocument = User & Document;

@Schema({ timestamps: true, versionKey: false })
export class User implements IUser {
  @Prop({
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true,
  })
  user_type!: 'user' | 'admin';

  @Prop({ type: String })
  full_name?: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    unique: true,
  })
  email_address!: string;

  @Prop({ type: Number })
  mobile_number?: number;

  @Prop({ type: String })
  country_code?: string;

  @Prop({ type: String })
  country_string_code?: string;

  @Prop({ type: String, default: null })
  password?: string | null;

  @Prop({ type: Boolean, default: false })
  is_social_login?: boolean;

  @Prop({ type: String, default: null })
  social_id?: string | null;

  @Prop({
    type: String,
    enum: ['google', 'facebook', 'apple', null],
    default: null,
  })
  social_platform?: 'google' | 'facebook' | 'apple' | null;

  @Prop({ type: Number, default: 0 })
  notification_badge?: number;

  @Prop({ type: LocationSchema })
  location?: Location;

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  customer_id?: string;

  @Prop({ type: Boolean, default: false })
  is_user_verified?: boolean;

  @Prop({ type: Boolean, default: false })
  is_blocked_by_admin?: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Geospatial index for location field
UserSchema.index({ location: '2dsphere' });
// Unique index on email address for safety at DB level
UserSchema.index({ mobile_number: 1 }, { unique: true });
UserSchema.index({ social_id: 1, social_platform: 1 });
