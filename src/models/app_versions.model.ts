import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppUpdateStatus = 'is_force_update' | 'is_not_need';
export type AppPlatform = 'ios' | 'android';

export interface IAppVersion {
  app_version: string;
  is_maintenance?: boolean;
  app_update_status?: AppUpdateStatus;
  app_platform: AppPlatform;
  app_url: string;
  api_base_url: string;
  is_live?: boolean;
  is_deleted?: boolean;
}

export type AppVersionDocument = IAppVersion & Document;

@Schema({ timestamps: true, versionKey: false })
export class AppVersion implements IAppVersion {
  @Prop({ type: String, required: true })
  app_version!: string;

  @Prop({ type: Boolean, default: false })
  is_maintenance?: boolean;

  @Prop({
    type: String,
    enum: ['is_force_update', 'is_not_need'],
    default: 'is_not_need',
  })
  app_update_status?: AppUpdateStatus;

  @Prop({ type: String, enum: ['ios', 'android'], required: true })
  app_platform!: AppPlatform;

  @Prop({ type: String, required: true })
  app_url!: string;

  @Prop({ type: String, required: true })
  api_base_url!: string;

  @Prop({ type: Boolean, default: true })
  is_live?: boolean;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const AppVersionSchema = SchemaFactory.createForClass(AppVersion);
// Quick lookup for latest live version by platform
AppVersionSchema.index({ app_platform: 1, is_live: 1, is_deleted: 1 });
