import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface IAppContent {
  content_type: 'terms_and_condition' | 'privacy_policy' | 'about';
  content?: string;
  is_deleted?: boolean;
}

export type AppContentDocument = IAppContent & Document;

@Schema({ timestamps: true, versionKey: false })
export class AppContent implements IAppContent {
  @Prop({
    type: String,
    enum: ['terms_and_condition', 'privacy_policy', 'about'],
    required: true,
  })
  content_type!: 'terms_and_condition' | 'privacy_policy' | 'about';

  @Prop({ type: String })
  content?: string;

  @Prop({ type: Boolean, default: false })
  is_deleted?: boolean;
}

export const AppContentSchema = SchemaFactory.createForClass(AppContent);
// Content is usually fetched by type (e.g., privacy_policy)
AppContentSchema.index({ content_type: 1 });
