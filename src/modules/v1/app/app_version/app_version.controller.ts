import { Controller, Post, Body, ValidationPipe, Res } from '@nestjs/common';
import { AppVersionService } from './app_version.service';
import { successRes } from 'src/common/responses.common';
import { Response } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { AddAppVersionDto, AppVersionCheckDto } from './dto/app_version.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('App Version')
@Controller('v1/app/appVersion')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @ApiResponse({
    status: 200,
    description: 'Add app version responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'App version added successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'common.App version added successfully.',
              data: {
                app_version: '1.0.0',
                is_maintenance: false,
                app_update_status: 'is_force_update',
                app_platform: 'android',
                app_url: 'www.google.com',
                api_base_url: 'www.google.com',
                is_live: true,
                is_deleted: false,
                _id: '68a82905a06a6f0a1e8c1be5',
                createdAt: '2025-08-22T08:23:33.499Z',
                updatedAt: '2025-08-22T08:23:33.499Z',
              },
            },
          },
        },
      },
    },
  })
  @Post('add_app_version')
  async addAppVersion(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AddAppVersionDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.appVersionService.addAppVersion(dto);
    return successRes(
      res,
      i18n.t('common.App version added successfully.'),
      data
    );
  }

  @ApiResponse({
    status: 200,
    description: 'App version checked responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'App version checked successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'common.App version checked successfully.',
              data: {
                is_need_update: false,
                is_force_update: false,
                is_maintenance: false,
                terms_and_condition: '',
                privacy_policy: 'This is Privacy policy',
                about: '',
              },
            },
          },
        },
      },
    },
  })
  @Post('app_version_check')
  async appVersionCheck(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AppVersionCheckDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.appVersionService.appVersionCheck(dto);
    return successRes(
      res,
      i18n.t('common.App version checked successfully.'),
      data
    );
  }
}
