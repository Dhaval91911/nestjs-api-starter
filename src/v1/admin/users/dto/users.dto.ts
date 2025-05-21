import 'reflect-metadata';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class updateUserDto {
  @IsOptional()
  user_id?: string | Types.ObjectId;

  @IsOptional()
  @IsString()
  name?: string;
}

export class changePasswordDto {
  @IsOptional()
  user_id?: string | Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  current_password?: string;

  @IsNotEmpty()
  @IsString()
  new_password!: string;
}

export class deleteUserDto {
  @IsNotEmpty()
  user_id!: string | Types.ObjectId;
}

export class deleteUserSessionsDto {
  @IsNotEmpty()
  user_id!: string | Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  auth_token!: string;
}

export class forgetPasswordDto {
  @IsNotEmpty()
  @IsString()
  email!: string;
}

export class verifyOtpDto {
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsNotEmpty()
  @IsNumber()
  otp!: number; // OTP to verify
}

export class resetPasswordDto {
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsNotEmpty()
  @IsString()
  new_password!: string;
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
