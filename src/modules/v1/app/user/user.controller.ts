import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import {
  GuestSessionDto,
  SignUpDto,
  UploadMediaDto,
  CheckEmailAddressDto,
  CheckMobileNumberDto,
} from './dto/user.dto';
import { successRes, errorRes } from 'src/common/responses.common';
import { Response } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserOnlyGuard } from 'src/common/guards/role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('App User')
@Controller('v1/app/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 200,
    description: 'Guest session responses',
    content: {
      'application/json': {
        examples: {
          GuestCreated: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Guest added successfully.',
              data: {
                device_token: 'device_token_1',
                device_type: 'web',
                location: {
                  type: 'Point',
                  coordinates: [-118.37912620062293, 34.175576230096624],
                },
                address: 'Surat',
                _id: '68a80acb132966cbee0a4a3d',
                createdAt: '2025-08-22T06:14:35.218Z',
                updatedAt: '2025-08-22T06:14:35.218Z',
              },
            },
          },
        },
      },
    },
  })
  @Post('guest_session')
  async guestSession(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: GuestSessionDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.guestSession(dto);
    return successRes(res, i18n.t('common.Guest added successfully.'), data);
  }

  @ApiResponse({
    status: 200,
    description: 'Check email address responses',
    content: {
      'application/json': {
        examples: {
          EmailExists: {
            summary: 'Email already exists',
            value: {
              success: false,
              statuscode: 0,
              message: 'Email address already exists.',
            },
          },
          EmailAvailable: {
            summary: 'Email available',
            value: {
              success: true,
              statuscode: 1,
              message: 'Email address available.',
              data: false,
            },
          },
        },
      },
    },
  })
  @Post('check_email_address')
  async checkEmailAddress(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CheckEmailAddressDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.checkEmailAddress(dto);
    if (data) {
      return errorRes(res, i18n.t('common.Email address already exists.'));
    }

    return successRes(res, i18n.t('common.Email address available.'), data);
  }

  @ApiResponse({
    status: 200,
    description: 'Check mobile number responses',
    content: {
      'application/json': {
        examples: {
          MobileExists: {
            summary: 'Mobile number already exists',
            value: {
              success: false,
              statuscode: 0,
              message: 'Mobile number already exists.',
            },
          },
          MobileAvailable: {
            summary: 'Mobile number available',
            value: {
              success: true,
              statuscode: 1,
              message: 'Mobile number available.',
              data: false,
            },
          },
        },
      },
    },
  })
  @Post('check_mobile_number')
  async checkMobileNumber(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CheckMobileNumberDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.checkMobileNumber(dto);
    if (data) {
      return errorRes(res, i18n.t('common.Mobile number already exists.'));
    }

    return successRes(res, i18n.t('common.Mobile number available.'), data);
  }

  @ApiResponse({
    status: 200,
    description: 'User signup responses',
    content: {
      'application/json': {
        examples: {
          SignUpSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'User signup successfully.',
              data: {},
            },
          },
        },
      },
    },
  })
  @Post('sign_up')
  async signUp(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SignUpDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.signUp(dto);
    return successRes(res, i18n.t('common.User signup successfully.'), data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Upload media responses',
    content: {
      'application/json': {
        examples: {
          UploadSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Media uploaded successfully.',
              data: {},
            },
          },
        },
      },
    },
  })
  @Post('upload_media')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'album', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ])
  )
  async uploadMedia(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: UploadMediaDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext,
    @UploadedFiles()
    files: { [fieldname: string]: Express.Multer.File[] }
  ) {
    const data = await this.userService.uploadMedia(dto, files, user);
    return successRes(res, i18n.t('common.Media uploaded successfully.'), data);
  }
}
