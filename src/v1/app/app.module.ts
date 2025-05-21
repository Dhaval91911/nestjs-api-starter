import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from '../../config/database.config';
import { DatabaseService } from '../../database/connect';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// import { RolesGuard } from '../../modules/users/guards/user.guard';
// import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseConfig,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    DatabaseService,
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
})
export class ApplicationModule {}
