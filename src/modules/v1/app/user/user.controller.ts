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
import { uploadMulterOptions } from '../../../../utils/multer.config';
import { UserService } from './user.service';
import {
  GuestSessionDto,
  SignUpDto,
  SignInUserDto,
  LogoutDto,
  SendOtpForgotPasswordUserDto,
  VerifyOtpUserDto,
  ResetPasswordUserDto,
  UserUpdatedDataDto,
  EditProfileDto,
  UploadMediaDto,
  CheckEmailAddressDto,
  CheckMobileNumberDto,
  RemoveMediaDto,
  GetNotificationsDto,
  ChangePasswordUserDto,
  DeleteAccountDto,
} from './dto/user.dto';
import { successRes, errorRes } from 'src/common/responses.common';
import { HttpCode, HttpStatus } from '@nestjs/common';
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
              data: {},
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
              data: null,
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
              data: null,
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

  @ApiResponse({
    status: 200,
    description: 'User sign in responses',
    content: {
      'application/json': {
        examples: {
          EmailNotFound: {
            summary: 'Email already used by you',
            value: {
              success: false,
              statuscode: 0,
              message:
                'This email has already been used by you. Kindly sign in using {{platform}}.',
            },
          },
          PasswordIncorrect: {
            summary: 'Password incorrect',
            value: {
              success: false,
              statuscode: 0,
              message:
                'The password you entered is incorrect. Please try again.',
            },
          },
          UserBlocked: {
            summary: 'User blocked',
            value: {
              success: false,
              statuscode: 0,
              message:
                'This account has been blocked. Please get in touch with the administrator.',
            },
          },
          SignInSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'User logged in successfully.',
              data: {},
            },
          },
        },
      },
    },
  })
  @Post('sign_in')
  async signIn(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SignInUserDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      const data = await this.userService.signIn(dto);
      return successRes(
        res,
        i18n.t('common.User logged in successfully.'),
        data
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg.startsWith('PLATFORM_MISMATCH:')) {
        const platform = msg.split(':')[1] || '';
        return errorRes(
          res,
          i18n.t('common.email_already_used_signin', {
            args: { platform },
          })
        );
      }
      switch (msg) {
        case 'USER_BLOCKED':
          return errorRes(
            res,
            i18n.t(
              'common.This account has been blocked. Please get in touch with the administrator.'
            )
          );
        case 'NO_ACCOUNT':
          return errorRes(
            res,
            i18n.t(
              'common.No account found associated with this email address.'
            )
          );
        case 'PASSWORD_REQUIRED':
          return errorRes(res, i18n.t('common.Password is required.'));
        case 'INCORRECT_PASSWORD':
          return errorRes(
            res,
            i18n.t(
              'common.The password you entered is incorrect. Please try again.'
            )
          );
        default:
          return errorRes(res, i18n.t('common.Internal server error'));
      }
    }
  }

  @Post('refresh_token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: { refresh_token: string; device_token: string },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.rotateRefreshToken(
      body.refresh_token,
      body.device_token
    );
    return successRes(
      res,
      i18n.t('common.Token refreshed successfully.'),
      data
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @Post('logout_all')
  async logoutAll(
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    await this.userService.logoutAll(user);
    return successRes(
      res,
      i18n.t('common.You have successfully logged out.'),
      null
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Send OTP forgot password responses',
    content: {
      'application/json': {
        examples: {
          EmailNotFound: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'No account found associated with this email address.',
            },
          },
          SocialAccount: {
            summary: 'Social account',
            value: {
              success: false,
              statuscode: 0,
              message:
                'This email has already been used by you. Kindly sign in using {{platform}}.',
            },
          },
          OtpSent: {
            summary: 'OTP sent successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'An OTP has been successfully sent to your email.',
              data: 1234,
            },
          },
        },
      },
    },
  })
  @Post('send_otp_forgot_password')
  async sendOtpForgotPassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SendOtpForgotPasswordUserDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      const data = await this.userService.sendOtpForgotPassword(dto);
      return successRes(
        res,
        i18n.t('common.An OTP has been successfully sent to your email.'),
        data
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'NO_ACCOUNT') {
        return errorRes(
          res,
          i18n.t('common.No account found associated with this email address.')
        );
      }
      if (msg.startsWith('PLATFORM_MISMATCH:')) {
        const platform = msg.split(':')[1] || '';
        return errorRes(
          res,
          i18n.t('common.email_already_used_signin', { args: { platform } })
        );
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiResponse({
    status: 200,
    description: 'Verify OTP responses',
    content: {
      'application/json': {
        examples: {
          EmailNotFound: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'No account found associated with this email address.',
            },
          },
          InvalidOtp: {
            summary: 'Invalid OTP',
            value: {
              success: false,
              statuscode: 0,
              message: 'Please enter a valid OTP.',
            },
          },
          OtpVerified: {
            summary: 'OTP verified',
            value: {
              success: true,
              statuscode: 1,
              message: 'OTP verified successfully.',
              data: null,
            },
          },
        },
      },
    },
  })
  @Post('verify_otp')
  async verifyOtp(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: VerifyOtpUserDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const found = await this.userService.findVerifyEmailAddress({
      email_address: dto.email_address,
    });
    if (!found) {
      return errorRes(
        res,
        i18n.t('common.No account found associated with this email address.')
      );
    }

    const ok = await this.userService.verifyOtp(dto);
    if (!ok) {
      return errorRes(res, i18n.t('common.Please enter a valid OTP.'));
    }

    return successRes(res, i18n.t('common.OTP verified successfully.'), null);
  }

  @ApiResponse({
    status: 200,
    description: 'Reset password responses',
    content: {
      'application/json': {
        examples: {
          InvalidRequest: {
            summary: 'Invalid request',
            value: {
              success: false,
              statuscode: 0,
              message: 'Invalid request.',
            },
          },
          EmailNotFound: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'No account found associated with this email address.',
            },
          },
          MobileNotFound: {
            summary: 'Mobile not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'No account found associated with this mobile number.',
            },
          },
          ResetSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Your password has been successfully changed.',
              data: null,
            },
          },
        },
      },
    },
  })
  @Post('reset_password')
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: ResetPasswordUserDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      await this.userService.resetPassword(dto);
      return successRes(
        res,
        i18n.t('common.Your password has been successfully changed.'),
        null
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      switch (msg) {
        case 'INVALID_REQUEST':
          return errorRes(res, i18n.t('common.Invalid request.'));
        case 'NO_ACCOUNT_EMAIL':
          return errorRes(
            res,
            i18n.t(
              'common.No account found associated with this email address.'
            )
          );
        case 'NO_ACCOUNT_MOBILE':
          return errorRes(
            res,
            i18n.t(
              'common.No account found associated with this mobile number.'
            )
          );
        default:
          return errorRes(res, i18n.t('common.Internal server error'));
      }
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Logout responses',
    content: {
      'application/json': {
        examples: {
          UserNotFound: {
            summary: 'User not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'User not found.',
            },
          },
          LogoutSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'You have successfully logged out.',
              data: null,
            },
          },
        },
      },
    },
  })
  @Post('logout')
  async logout(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: LogoutDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      await this.userService.logout(dto, user);
      return successRes(
        res,
        i18n.t('common.You have successfully logged out.'),
        null
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
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
    FileFieldsInterceptor(
      [
        { name: 'album', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      uploadMulterOptions
    )
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @Post('presign_upload')
  async presignUpload(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: { content_type: string; folder?: string },
    @CurrentUser() _user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const data = await this.userService.createPresignedUpload(
      body.content_type,
      body.folder
    );
    return successRes(res, i18n.t('common.Success'), data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Remove media responses',
    content: {
      'application/json': {
        examples: {
          RemoveSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Media removed successfully.',
              data: null,
            },
          },
          AlbumNotFound: {
            summary: 'Album not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'Album not found.',
            },
          },
          RemoveFailed: {
            summary: 'Remove failed',
            value: {
              success: false,
              statuscode: 0,
              message: 'Failed to remove user media.',
            },
          },
        },
      },
    },
  })
  @Post('remove_media')
  async removeMedia(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: RemoveMediaDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      await this.userService.removeMedia(dto, user);
      return successRes(
        res,
        i18n.t('common.Media removed successfully.'),
        null
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'ALBUM_NOT_FOUND') {
        return errorRes(res, i18n.t('common.Album not found.'));
      }
      if (msg === 'FAILED_TO_REMOVE_USER_MEDIA') {
        return errorRes(res, i18n.t('common.Failed to remove user media.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Send notifications responses',
    content: {
      'application/json': {
        examples: {
          NotificationsSuccess: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Notifications send successfully.',
              data: {},
            },
          },
        },
      },
    },
  })
  @Post('send_notifications')
  async sendNotifications(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: GetNotificationsDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      const data = await this.userService.sendNotifications(user);
      return successRes(
        res,
        i18n.t('common.Notifications send successfully.'),
        data
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Change password responses',
    content: {
      'application/json': {
        examples: {
          PasswordChanged: {
            summary: 'Password changed successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Your password has been changed.',
              data: null,
            },
          },
          SocialLoginError: {
            summary: 'Social login user cannot change password',
            value: {
              success: false,
              statuscode: 0,
              message:
                'You cannot change password for social login account. Please use your social platform to manage your password.',
            },
          },
          OldPasswordIncorrect: {
            summary: 'Old password incorrect',
            value: {
              success: false,
              statuscode: 0,
              message: 'The old password is incorrect. Please try again.',
            },
          },
          PasswordSimilar: {
            summary: 'New password similar to old',
            value: {
              success: false,
              statuscode: 0,
              message:
                'Your existing and new password are similar. Please try a different password.',
            },
          },
        },
      },
    },
  })
  @Post('change_password')
  async changePassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: ChangePasswordUserDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      await this.userService.changePassword(dto, user);
      return successRes(
        res,
        i18n.t('common.Your password has been changed.'),
        null
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      if (msg.startsWith('SOCIAL_LOGIN_PASSWORD_CHANGE:')) {
        const platform = msg.split(':')[1];
        return errorRes(
          res,
          i18n.t(
            `auth.You can't change your password here because you signed in using your ${platform}.`
          )
        );
      }
      if (msg === 'OLD_PASSWORD_INCORRECT') {
        return errorRes(
          res,
          i18n.t('common.The old password is incorrect. Please try again.')
        );
      }
      if (msg === 'PASSWORD_SIMILAR') {
        return errorRes(
          res,
          i18n.t(
            'common.Your existing and new password are similar. Please try a different password.'
          )
        );
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'User updated data responses',
    content: {
      'application/json': {
        examples: {
          UserNotFound: {
            summary: 'User not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'User not found.',
            },
          },
          Success: {
            summary: 'Success',
            value: {
              success: true,
              statuscode: 1,
              message: 'Successfully updated user data.',
              data: {},
            },
          },
        },
      },
    },
  })
  @Post('user_updated_data')
  async userUpdatedData(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    _dto: UserUpdatedDataDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      const data = await this.userService.userUpdatedData(user);
      return successRes(
        res,
        i18n.t('common.Successfully updated user data.'),
        data
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Edit profile responses',
    content: {
      'application/json': {
        examples: {
          Success: {
            summary: 'Profile updated',
            value: {
              success: true,
              statuscode: 1,
              message: 'Successfully updated user data.',
              data: {},
            },
          },
          UserNotFound: {
            summary: 'User not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'User not found.',
            },
          },
          MobileExists: {
            summary: 'Mobile already exists',
            value: {
              success: false,
              statuscode: 0,
              message: 'Mobile number already exists.',
            },
          },
        },
      },
    },
  })
  @Post('edit_profile')
  async editProfile(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: EditProfileDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      const data = await this.userService.editProfile(dto, user);
      return successRes(
        res,
        i18n.t('common.Successfully updated user data.'),
        data
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      if (msg === 'MOBILE_EXISTS') {
        return errorRes(res, i18n.t('common.Mobile number already exists.'));
      }
      if (msg === 'INVALID_LOCATION') {
        return errorRes(res, i18n.t('common.Invalid request.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, UserOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Delete account responses',
    content: {
      'application/json': {
        examples: {
          DeleteSuccess: {
            summary: 'Delete account successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Your account has been deleted.',
              data: null,
            },
          },
          UserNotFound: {
            summary: 'User not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'User not found.',
            },
          },
        },
      },
    },
  })
  @Post('delete_account')
  async deleteAccount(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: DeleteAccountDto,
    @CurrentUser() user: { _id: Types.ObjectId },
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    try {
      await this.userService.deleteAccount(user);
      return successRes(
        res,
        i18n.t('common.Your account has been deleted.'),
        null
      );
    } catch (error: unknown) {
      const msg: string =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';
      if (msg === 'USER_NOT_FOUND') {
        return errorRes(res, i18n.t('common.User not found.'));
      }
      return errorRes(res, i18n.t('common.Internal server error'));
    }
  }
}
