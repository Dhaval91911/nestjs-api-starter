import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { S3_CLIENT } from 'src/config/bucket.config';
import { Express } from 'express';

@Injectable()
export class BucketUtil {
  private readonly logger = new Logger(BucketUtil.name);

  constructor(@Inject(S3_CLIENT) private readonly s3Client: S3Client) {}

  async uploadMediaIntoS3Bucket(
    media_file: Express.Multer.File,
    folder_name: string,
    content_type?: string
  ): Promise<{ status: boolean; file_name: string | null }> {
    try {
      let contenttype = content_type ?? media_file.mimetype;
      let file_extension =
        media_file.originalname.split('.').pop()?.toLowerCase() ?? '';

      if (file_extension === 'avif') {
        file_extension = 'jpg';
        contenttype = 'image/jpeg';
      }
      if (file_extension === 'mov') {
        file_extension = 'mp4';
        contenttype = 'video/mp4';
      }

      const file_name = `${Math.floor(1000 + Math.random() * 8000)}_${Date.now()}.${file_extension}`;

      let fileStream: Buffer | fs.ReadStream;
      if (media_file.path) {
        fileStream = fs.createReadStream(media_file.path);
      } else if (media_file.buffer) {
        fileStream = media_file.buffer;
      } else {
        throw new Error('Uploaded file has neither path nor buffer.');
      }

      const newPath = process.env.BUCKET_ENV + `${folder_name}/` + file_name;

      const params = {
        Bucket: process.env.BUCKET_NAME!,
        Key: newPath,
        Body: fileStream,
        ContentType: contenttype,
        ACL: 'private',
      } as const;

      const upload_media_file_into_s3_bucket_params = new PutObjectCommand(
        params
      );
      const uploaded_file_res = await this.s3Client.send(
        upload_media_file_into_s3_bucket_params
      );

      if (uploaded_file_res) {
        return { status: true, file_name };
      } else {
        return { status: false, file_name: null };
      }
    } catch (error) {
      this.logger.error('uploadMediaIntoS3Bucket failed', error as Error);
      return { status: false, file_name: null };
    }
  }

  async removeMediaFromS3Bucket(
    media_file: string
  ): Promise<{ status: boolean }> {
    try {
      const params = {
        Bucket: process.env.BUCKET_NAME!,
        Key: process.env.BUCKET_ENV + media_file,
      } as const;

      const command = new DeleteObjectCommand(params);
      const data = await this.s3Client.send(command);

      if (data) {
        return { status: true };
      } else {
        return { status: false };
      }
    } catch (error) {
      this.logger.error('removeMediaFromS3Bucket failed', error as Error);
      return { status: false };
    }
  }
}
