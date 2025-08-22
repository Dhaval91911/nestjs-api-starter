import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/v1/admin/auth/auth.module';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { resolve } from 'path';
import { BodyLangResolver } from './i18n/body-lang.resolver';
import { UserModule } from './modules/v1/app/user/user.module';
import { NotificationModule } from './notification/notification.module';
import { SocketAuthGuard } from './common/guards/socket-auth.guard';
import { Server } from 'socket.io';
import { V1ChatModule } from './socket/v1/chat/chat.module';
import { CronjobsService } from './cronjobs/cronjobs.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppContentService } from './modules/v1/admin/app_content/app_content.service';
import { AppContentModule } from './modules/v1/admin/app_content/app_content.module';
import { AppVersionModule } from './modules/v1/app/app_version/app_version.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseConfig,
    AuthModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: { path: resolve(process.cwd(), 'src/i18n'), watch: true },
      resolvers: [
        { use: BodyLangResolver, options: ['ln'] },
        AcceptLanguageResolver,
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 3,
        },
      ],
    }),
    UserModule,
    NotificationModule,
    V1ChatModule,
    AppContentModule,
    AppVersionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SocketAuthGuard,
    CronjobsService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AppContentService,
  ],
})
export class AppModule {
  constructor(private readonly socketAuthGuard: SocketAuthGuard) {}

  configureSockets(server: Server) {
    const nsp = server.of('/v1');
    nsp.use((socket, next) => {
      this.socketAuthGuard.use(socket, next).catch(next);
    });
  }
}
