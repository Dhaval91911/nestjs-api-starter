import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppVersion } from 'src/models/app_versions.model';
import { AppContent } from 'src/models/app_contents.model';
import { AddAppVersionDto, AppVersionCheckDto } from './dto/app_version.dto';

@Injectable()
export class AppVersionService {
  constructor(
    @InjectModel(AppVersion.name) private appVersionModel: Model<AppVersion>,
    @InjectModel(AppContent.name) private appContentModel: Model<AppContent>
  ) {}

  async addAppVersion(dto: AddAppVersionDto) {
    const {
      app_version,
      is_maintenance,
      app_update_status,
      app_platform,
      app_url,
      api_base_url,
      is_live,
    } = dto;

    const data = await this.appVersionModel.create({
      app_version,
      is_maintenance,
      app_update_status,
      app_platform,
      app_url,
      api_base_url,
      is_live,
    });

    return data;
  }

  async appVersionCheck(dto: AppVersionCheckDto) {
    const { app_version, app_platform } = dto;

    let result: {
      is_need_update: boolean;
      is_force_update: boolean;
      is_maintenance?: boolean;
    } = {
      is_need_update: false,
      is_force_update: false,
    };

    const check_version = await this.appVersionModel.findOne({
      app_version,
      is_live: true,
      app_platform,
      is_deleted: false,
    });

    let app_update_status = '';

    if (check_version) {
      if (check_version.app_version !== app_version) {
        app_update_status = check_version.app_update_status ?? '';

        if (app_update_status === 'is_force_update') {
          result = {
            ...result,
            is_need_update: true,
            is_force_update: true,
          };
        } else {
          result = {
            ...result,
            is_need_update: true,
            is_force_update: false,
          };
        }
      } else {
        result = {
          ...result,
          is_need_update: false,
          is_force_update: false,
        };
      }
      result.is_maintenance = check_version.is_maintenance;
    } else {
      const latestVersion = await this.appVersionModel.findOne({
        is_live: true,
        app_platform,
        is_deleted: false,
      });

      app_update_status = latestVersion?.app_update_status ?? '';

      if (app_update_status === 'is_force_update') {
        result = { ...result, is_need_update: true, is_force_update: true };
      } else {
        result = {
          ...result,
          is_need_update: true,
          is_force_update: false,
        };
      }
      result.is_maintenance = latestVersion?.is_maintenance ?? false;
    }

    const find_terms_and_condition = await this.appContentModel.findOne({
      content_type: 'terms_and_condition',
      is_deleted: false,
    });

    const find_privacy_policy = await this.appContentModel.findOne({
      content_type: 'privacy_policy',
      is_deleted: false,
    });

    const find_about = await this.appContentModel.findOne({
      content_type: 'about',
      is_deleted: false,
    });

    const result_data = {
      ...result,
      terms_and_condition: find_terms_and_condition?.content ?? '',
      privacy_policy: find_privacy_policy?.content ?? '',
      about: find_about?.content ?? '',
    };

    return result_data;
  }
}
