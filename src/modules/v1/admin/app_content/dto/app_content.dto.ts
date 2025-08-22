import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class AddContentDto {
  @ApiProperty({ example: 'privacy_policy' })
  @IsNotEmpty()
  @IsString()
  content_type!: string;

  @ApiProperty({ example: 'This is Privacy policy' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class EditContentDto {
  @ApiProperty({ example: '68a82905a06a6f0a1e8c1be5' })
  @IsNotEmpty()
  content_id!: Types.ObjectId;

  @ApiProperty({ example: 'privacy_policy' })
  @IsNotEmpty()
  @IsString()
  content_type!: string;

  @ApiProperty({ example: 'This is Privacy policy' })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class DeleteContentDto {
  @ApiProperty({ example: '68a82905a06a6f0a1e8c1be5' })
  @IsNotEmpty()
  content_id!: Types.ObjectId;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class FindContentByTypeDto {
  @ApiProperty({ example: 'privacy_policy' })
  @IsNotEmpty()
  @IsString()
  content_type!: string;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}

export class FindContentDto {
  @ApiProperty({ example: '68a82905a06a6f0a1e8c1be5' })
  @IsNotEmpty()
  content_id!: Types.ObjectId;

  @ApiProperty({ example: 'en' })
  @IsOptional()
  @IsString()
  ln?: string;
}
