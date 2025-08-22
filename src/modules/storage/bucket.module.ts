import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { s3ClientProvider } from 'src/config/bucket.config';
import { BucketUtil } from 'src/utils/bucket.util';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [s3ClientProvider, BucketUtil],
  exports: [s3ClientProvider, BucketUtil],
})
export class BucketModule {}
