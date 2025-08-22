import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddAppVersionDto {
  @ApiProperty({ example: '1.0.0' })
  @IsNotEmpty()
  @IsString()
  app_version!: string;

  @ApiProperty({ example: false })
  @IsNotEmpty()
  @IsBoolean()
  is_maintenance!: boolean;

  @ApiProperty({
    example: 'is_force_update',
    description: 'is_not_need | is_force_update',
  })
  @IsNotEmpty()
  @IsString()
  app_update_status!: string;

  @ApiProperty({ example: 'android', description: 'android | ios | web' })
  @IsNotEmpty()
  @IsString()
  app_platform!: string;

  @ApiProperty({
    example: 'https://play.google.com/store/apps/details?id=com.example',
  })
  @IsNotEmpty()
  @IsString()
  app_url!: string;

  @ApiProperty({ example: 'https://api.example.com' })
  @IsNotEmpty()
  @IsString()
  api_base_url!: string;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  is_live!: boolean;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  ln?: string;
}

export class AppVersionCheckDto {
  @ApiProperty({ example: '1.0.0' })
  @IsNotEmpty()
  @IsString()
  app_version!: string;

  @ApiProperty({ example: 'android', description: 'android | ios | web' })
  @IsNotEmpty()
  @IsString()
  app_platform!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  ln?: string;
}
