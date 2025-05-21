// src/user/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, versionKey: false }) // versionKey disabled
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, enum: ['user', 'admin', 'manager'], default: 'user' })
  userType!: 'user' | 'admin' | 'manager';

  @Prop({ required: true })
  password!: string;

  @Prop({ default: null })
  otp?: number;

  @Prop({ default: false })
  is_deleted?: boolean;

  _id?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
