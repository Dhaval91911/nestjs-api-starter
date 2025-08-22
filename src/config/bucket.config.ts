import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';

export const S3_CLIENT = Symbol('AWS_S3_CLIENT');

export const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  useFactory: (config: ConfigService) =>
    new S3Client({
      region: config.get<string>('REGION')!,
      credentials: {
        accessKeyId: config.get<string>('ACCESSKEYID')!,
        secretAccessKey: config.get<string>('SECRETACCESSKEY')!,
      },
      useAccelerateEndpoint: false,
    }),
  inject: [ConfigService],
};

export {
  PutObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  DeleteObjectCommand,
};
