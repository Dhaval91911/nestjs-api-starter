import { Module } from '@nestjs/common';
import { AppVersionService } from './app_version.service';
import { AppVersionController } from './app_version.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppVersion, AppVersionSchema } from 'src/models/app_versions.model';
import { AppContent, AppContentSchema } from 'src/models/app_contents.model';
import { UserOnlyGuard } from 'src/common/guards/role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: AppContent.name, schema: AppContentSchema },
    ]),
  ],
  providers: [AppVersionService, UserOnlyGuard],
  controllers: [AppVersionController],
})
export class AppVersionModule {}
