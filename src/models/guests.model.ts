import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface ILocation {
  type?: string;
  coordinates: number[]; // [longitude, latitude]
}

@Schema({ _id: false })
export class Location implements ILocation {
  @Prop({ type: String, default: 'Point' })
  type?: string;

  @Prop({ type: [Number], required: true })
  coordinates!: number[];
}

export const LocationSchema = SchemaFactory.createForClass(Location);

export interface IGuest {
  device_token: string;
  device_type: 'ios' | 'android' | 'web';
  location?: ILocation;
  address?: string;
}

export type GuestDocument = IGuest & Document;

@Schema({ timestamps: true, versionKey: false })
export class Guest implements IGuest {
  @Prop({ type: String, required: true })
  device_token!: string;

  @Prop({ type: String, enum: ['ios', 'android', 'web'], required: true })
  device_type!: 'ios' | 'android' | 'web';

  @Prop({ type: LocationSchema })
  location?: ILocation;

  @Prop({ type: String })
  address?: string;
}

export const GuestSchema = SchemaFactory.createForClass(Guest);
GuestSchema.index({ location: '2dsphere' });
// Ensure quick lookup by device token (frequently queried for push notifications)
GuestSchema.index({ device_token: 1 });
