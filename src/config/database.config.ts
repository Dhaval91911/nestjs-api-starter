import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

export const DatabaseConfig = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const uri = configService.get<string>('MONGODB_URI');
    return {
      uri,
      connectionFactory: (connection: Connection): Connection => {
        console.log('✅ MongoDB connected successfully');
        return connection;
      },
    };
  },
});
