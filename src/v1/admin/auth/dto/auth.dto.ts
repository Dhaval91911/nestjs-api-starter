import 'reflect-metadata';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class SignUpDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  device_token!: string;

  @IsString()
  @IsNotEmpty()
  device_type!: string;
}

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsString()
  @IsNotEmpty()
  device_token!: string;

  @IsString()
  @IsNotEmpty()
  device_type!: string;
}

export class CreateUserSessionDto {
  @IsNotEmpty()
  user_id!: string | Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  device_token!: string;

  @IsString()
  @IsOptional()
  auth_token!: string;

  @IsString()
  @IsNotEmpty()
  device_type!: string;
}
