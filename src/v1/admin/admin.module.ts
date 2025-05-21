import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from '../../config/database.config';
import { DatabaseService } from '../../database/connect';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// import { RolesGuard } from '../../modules/users/guards/user.guard';
// import { APP_GUARD } from '@nestjs/core';
import { AppContentModule } from './app-content/app-content.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseConfig,
    AuthModule,
    UsersModule,
    AppContentModule,
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
export class AdminModule {}
