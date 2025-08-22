import {
  IsEmail,
  IsIn,
  IsLowercase,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindGuestUserDto {
  @ApiProperty({ example: 'device_token_1' })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class GuestSessionDto {
  @ApiProperty({ example: 'device_token_1' })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiProperty({ example: 'web' })
  @IsIn(['web', 'android', 'ios'])
  @IsNotEmpty()
  device_type!: 'web' | 'android' | 'ios';

  @ApiProperty({
    example:
      '{"type":"Point","coordinates":[-118.37912620062293,34.175576230096624]}',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'address_1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class CheckEmailAddressDto {
  @ApiProperty({ example: 'admin@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  email_address!: string;

  @IsOptional()
  @IsString()
  ln?: string;
}

export class CheckMobileNumberDto {
  @ApiProperty({ example: 1234567890 })
  @IsNotEmpty()
  @IsNumber()
  mobile_number!: number;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class SignUpDto {
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

  @ApiProperty({ example: '+91' })
  @IsOptional()
  @IsString()
  country_code?: string;

  @ApiProperty({ example: 'IN' })
  @IsOptional()
  @IsString()
  country_string_code?: string;

  @ApiProperty({ example: 1234567890 })
  @IsOptional()
  mobile_number?: number;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  is_social_login?: boolean;

  @ApiProperty({ example: 'social_id_1' })
  @IsOptional()
  @IsString()
  social_id?: string;

  @ApiProperty({ example: 'social_platform_1' })
  @IsOptional()
  @IsString()
  social_platform?: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'device_token_1' })
  @IsOptional()
  @IsString()
  device_token?: string;

  @ApiProperty({ example: 'web' })
  @IsIn(['web', 'android', 'ios'])
  @IsNotEmpty()
  device_type!: 'web' | 'android' | 'ios';

  @ApiProperty({
    example:
      '{"type":"Point","coordinates":[-118.37912620062293,34.175576230096624]}',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'address_1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class UploadMediaDto {
  @ApiProperty({ example: 'album_type_1' })
  @IsNotEmpty()
  @IsString()
  album_type!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class FindDeviceTokenDto {
  @ApiProperty({ example: '68a82905a06a6f0a1e8c1be5' })
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}
