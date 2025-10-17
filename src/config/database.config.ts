import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseConfig');

interface MongoExtraOptions {
  tls?: boolean;
  authSource?: string;
  user?: string;
  pass?: string;
  retryWrites?: boolean;
  w?: 'majority' | number;
  serverSelectionTimeoutMS?: number;
}

export const DatabaseConfig = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const uri = configService.get<string>('MONGODB_URI');
    const extra: MongoExtraOptions = {
      tls: configService.get<boolean>('MONGODB_TLS') ?? true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
    };

    const user = configService.get<string>('MONGODB_USER');
    const pass = configService.get<string>('MONGODB_PASSWORD');
    const authSource =
      configService.get<string>('MONGODB_AUTH_SOURCE') ?? 'admin';
    if (user && pass) {
      extra.user = user;
      extra.pass = pass;
      extra.authSource = authSource;
    }

    return {
      uri,
      ...extra,
      connectionFactory: (connection: Connection): Connection => {
        if (configService.get<string>('NODE_ENV') !== 'production') {
          logger.log('✅ MongoDB connected successfully');
        }
        return connection;
      },
    };
  },
});
