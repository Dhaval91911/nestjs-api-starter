import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsIn,
  IsLowercase,
  IsNumber,
} from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class findVerifyEmailAddressDto {
  @ApiProperty({ example: 'admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;
}

export class findEmailAddressDto {
  @ApiProperty({ example: 'admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;
}

export class findUserDto {
  @ApiProperty({
    example: '68a815887a20c7a3979fc474',
    description: 'Mongo ObjectId',
  })
  @IsNotEmpty()
  _id!: Types.ObjectId;
}

export class AdminSignUpDto {
  @ApiProperty({ example: 'JK - Admin' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: 'jk_admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: ['web'], example: 'web' })
  @IsIn(['web'])
  @IsNotEmpty()
  device_type!: 'web';

  @ApiProperty({ example: 'device_token_1' })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class SignInDto {
  @ApiProperty({ example: 'jk_admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: ['web'], example: 'web' })
  @IsIn(['web'])
  @IsNotEmpty()
  device_type!: 'web';

  @ApiProperty({ example: 'device_token_1' })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Old@1234' })
  @IsNotEmpty()
  @IsString()
  old_password!: string;

  @ApiProperty({ example: 'New@1234' })
  @IsNotEmpty()
  @IsString()
  new_password!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class SendOtpForgotPasswordDto {
  @ApiProperty({ example: 'jk_admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 7707 })
  @IsNotEmpty()
  @IsNumber()
  otp!: number;

  @ApiProperty({ example: 'jk_admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'jk_admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @ApiProperty({ example: 'New@1234' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}
