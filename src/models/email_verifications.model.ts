import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface IEmailVerification {
  email_address: string;
  otp?: number | null;
  is_email_verified?: boolean;
  is_deleted?: boolean;
}

export type EmailVerificationDocument = IEmailVerification & Document;

@Schema({ timestamps: true, versionKey: false })
export class EmailVerification implements IEmailVerification {
  @Prop({ type: String, trim: true, lowercase: true, required: true })
  email_address!: string;

  @Prop({ type: Number, default: null })
  otp?: number | null;

  @Prop({ type: Boolean, default: false })
  is_email_verified?: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);
