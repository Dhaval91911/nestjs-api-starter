import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlbumType = 'image' | 'video';

export interface IUserAlbum {
  user_id: Types.ObjectId;
  album_type?: AlbumType;
  album_thumbnail?: string | null;
  album_path?: string;
}

export type UserAlbumDocument = IUserAlbum & Document;

@Schema({ timestamps: true, versionKey: false })
export class UserAlbum implements IUserAlbum {
  @Prop({ type: Types.ObjectId, ref: 'users', required: true })
  user_id!: Types.ObjectId;

  @Prop({ type: String, enum: ['image', 'video'] })
  album_type?: AlbumType;

  @Prop({ type: String, default: null })
  album_thumbnail?: string | null;

  @Prop({ type: String })
  album_path?: string;
}

export const UserAlbumSchema = SchemaFactory.createForClass(UserAlbum);
// Fetch albums per user quickly, ordered by recency
UserAlbumSchema.index({ user_id: 1, createdAt: -1 });
// Allow filtering by album_type for media tabs
UserAlbumSchema.index({ album_type: 1 });
