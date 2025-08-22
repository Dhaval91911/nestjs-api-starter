import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from 'src/common/guards/role.guard';
import { AppContentService } from './app_content.service';
import { successRes, errorRes } from 'src/common/responses.common';
import { Response } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import {
  AddContentDto,
  EditContentDto,
  DeleteContentDto,
} from './dto/app_content.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiTags('App Content')
@Controller('v1/admin/appContent')
export class AppContentController {
  constructor(private readonly appContentService: AppContentService) {}

  @ApiResponse({
    status: 200,
    description: 'Add content responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Content already exists',
            value: {
              success: false,
              statuscode: 0,
              message: 'Content already exists.',
            },
          },
          Second: {
            summary: 'Content added successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Content added successfully.',
              data: {
                content_type: 'privacy_policy',
                content: 'This is Privacy policy',
                is_deleted: false,
                _id: '68a82643f9bc1260ce612317',
                createdAt: '2025-08-22T08:11:47.718Z',
                updatedAt: '2025-08-22T08:11:47.718Z',
              },
            },
          },
        },
      },
    },
  })
  @Post('add_content')
  async addContent(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AddContentDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_content = await this.appContentService.findContentByType(dto);

    if (find_content) {
      return errorRes(res, i18n.t('common.Content already exists.'));
    }

    const data = await this.appContentService.addContent(dto);
    return successRes(res, i18n.t('common.Content added successfully.'), data);
  }

  @ApiResponse({
    status: 200,
    description: 'Edit content responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Content not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'Content not found.',
            },
          },
          Second: {
            summary: 'Content edited successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Content edited successfully.',
              data: {
                content_type: 'privacy_policy',
                content: 'This is Privacy policy',
                is_deleted: false,
                _id: '68a82643f9bc1260ce612317',
                createdAt: '2025-08-22T08:11:47.718Z',
                updatedAt: '2025-08-22T08:11:47.718Z',
              },
            },
          },
        },
      },
    },
  })
  @Post('edit_content')
  async editContent(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: EditContentDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_content = await this.appContentService.findContent(dto);

    if (!find_content) {
      return errorRes(res, i18n.t('common.Content not found.'));
    }

    const data = await this.appContentService.editContent(dto);
    return successRes(res, i18n.t('common.Content edited successfully.'), data);
  }

  @ApiResponse({
    status: 200,
    description: 'Delete content responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Content not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'Content not found.',
            },
          },
          Second: {
            summary: 'Content deleted successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Content deleted successfully.',
              data: null,
            },
          },
        },
      },
    },
  })
  @Post('delete_content')
  async deleteContent(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: DeleteContentDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_content = await this.appContentService.findContent(dto);

    if (!find_content) {
      return errorRes(res, i18n.t('common.Content not found.'));
    }

    await this.appContentService.deleteContent(dto);
    return successRes(
      res,
      i18n.t('common.Content deleted successfully.'),
      null
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Get content responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Content retrieved successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'common.Content retrieved successfully.',
              data: [
                {
                  _id: '68a82643f9bc1260ce612317',
                  content_type: 'privacy_policy',
                  content: 'This is Privacy policy',
                  is_deleted: false,
                  createdAt: '2025-08-22T08:11:47.718Z',
                  updatedAt: '2025-08-22T08:11:47.718Z',
                },
              ],
            },
          },
        },
      },
    },
  })
  @Post('get_content')
  async getContent(@Res() res: Response, @I18n() i18n: I18nContext) {
    const data = await this.appContentService.getContent();
    return successRes(
      res,
      i18n.t('common.Content retrieved successfully.'),
      data
    );
  }
}
