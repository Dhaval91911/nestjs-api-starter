import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AdminSignUpDto,
  SignInDto,
  ChangePasswordDto,
  SendOtpForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { successRes, errorRes } from 'src/common/responses.common';
import { Response, Request } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import {
  comparePassword,
  securePassword,
} from 'src/utils/secure_password.util';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from 'src/common/guards/role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IUser } from 'src/models/users.model';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin Auth')
@Controller('v1/admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 200,
    description: 'Admin signup responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Email already exists',
            value: {
              success: false,
              statuscode: 0,
              message:
                'This email address is already registered. Please use a different email or log in to your existing account.',
            },
          },
          Second: {
            summary: 'Admin created successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Admin account created successfully.',
              data: {
                user_type: 'admin',
                full_name: 'JK - Admin',
                email_address: 'jk_admin@yopmil.com',
                password: '073d86b6cc2558aa949e4d2177237765',
                is_social_login: false,
                social_id: null,
                social_platform: null,
                notification_badge: 0,
                is_user_verified: false,
                is_blocked_by_admin: false,
                is_deleted: false,
                _id: '68a815887a20c7a3979fc474',
                createdAt: '2025-08-22T07:00:24.171Z',
                updatedAt: '2025-08-22T07:00:24.171Z',
                token:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTgxNTg4N2EyMGM3YTM5NzlmYzQ3NCIsImlhdCI6MTc1NTg0NjAyNH0.OhglMPiwnWIFESM7_c53902pVhChjiyjY_ShnVxDrfM',
              },
            },
          },
        },
      },
    },
  })
  @Post('sign_up')
  async signUp(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: AdminSignUpDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const check_admin_email =
      await this.authService.findVerifyEmailAddress(dto);
    if (check_admin_email) {
      return errorRes(
        res,
        i18n.t(
          'common.This email address is already registered. Please use a different email or log in to your existing account.'
        )
      );
    }

    const data = await this.authService.signUp(dto);
    return successRes(
      res,
      i18n.t('common.Admin account created successfully.'),
      data
    );
  }

  @ApiResponse({
    status: 200,
    description: 'Admin sign in responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'No account found associated with this email address.',
            },
          },
          Second: {
            summary: 'Password incorrect',
            value: {
              success: false,
              statuscode: 0,
              message:
                'The password you entered is incorrect. Please try again.',
            },
          },
          Third: {
            summary: 'Admin logged in successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Admin logged in successfully.',
              data: {
                user_type: 'admin',
                full_name: 'JK - Admin',
                email_address: 'jk_admin@yopmil.com',
                password: '073d86b6cc2558aa949e4d2177237765',
                is_social_login: false,
                social_id: null,
                social_platform: null,
                notification_badge: 0,
                is_user_verified: false,
                is_blocked_by_admin: false,
                is_deleted: false,
                _id: '68a815887a20c7a3979fc474',
                createdAt: '2025-08-22T07:00:24.171Z',
                updatedAt: '2025-08-22T07:00:24.171Z',
                token:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YTgxNTg4N2EyMGM3YTM5NzlmYzQ3NCIsImlhdCI6MTc1NTg0NjAyNH0.OhglMPiwnWIFESM7_c53902pVhChjiyjY_ShnVxDrfM',
              },
            },
          },
        },
      },
    },
  })
  @Post('sign_in')
  async signIn(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SignInDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_admin = await this.authService.findEmailAddress(dto);
    if (!find_admin) {
      return errorRes(
        res,
        i18n.t('common.No account found associated with this email address.')
      );
    }

    const password_verify = comparePassword(dto.password, find_admin.password!);

    if (!password_verify) {
      return errorRes(
        res,
        i18n.t(
          'common.The password you entered is incorrect. Please try again.'
        )
      );
    }

    const data = await this.authService.signIn(dto);
    return successRes(
      res,
      i18n.t('common.Admin logged in successfully.'),
      data
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Change password responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Old password incorrect',
            value: {
              success: false,
              statuscode: 0,
              message:
                'The old password you entered is incorrect. Please try again.',
            },
          },
          Second: {
            summary: 'New password too similar',
            value: {
              success: false,
              statuscode: 0,
              message:
                'The new password is too similar to the old password. Please choose a different one.',
            },
          },
          Third: {
            summary: 'Password changed successfully',
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
  @Post('change_password')
  async changePassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: ChangePasswordDto,
    @CurrentUser()
    user: IUser & { _id: Types.ObjectId; password?: string | null },
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const password_verify = comparePassword(
      dto.old_password,
      String(user.password ?? '')
    );

    if (!password_verify) {
      return errorRes(
        res,
        i18n.t(
          'common.The old password you entered is incorrect. Please try again.'
        )
      );
    }

    const hashedPassword = securePassword(dto.new_password);

    const find_admin = await this.authService.findUser({ _id: user._id });

    if (find_admin?.password == hashedPassword) {
      return errorRes(
        res,
        i18n.t(
          'The new password is too similar to the old password. Please choose a different one.'
        )
      );
    }

    const rawHeader = req.get('authorization') ?? '';
    const token = rawHeader.startsWith('Bearer ')
      ? rawHeader.slice(7)
      : rawHeader;

    await this.authService.changePassword(dto, {
      _id: String(user._id),
      token,
    });

    return successRes(
      res,
      i18n.t('common.Your password has been successfully changed.'),
      null
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Send OTP forgot password responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message:
                'No account associated with this email address was found.',
            },
          },
          Second: {
            summary: 'OTP sent successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'An OTP has been successfully sent to your email.',
              data: 7707,
            },
          },
        },
      },
    },
  })
  @Post('send_otp_forgot_password')
  async sendOtpForgotPassword(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: SendOtpForgotPasswordDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_admin = await this.authService.findEmailAddress(dto);
    if (!find_admin) {
      return errorRes(
        res,
        i18n.t(
          'common.No account associated with this email address was found.'
        )
      );
    }

    const data = await this.authService.sendOtpForgotPassword(dto);
    return successRes(
      res,
      i18n.t('common.An OTP has been successfully sent to your email.'),
      data
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Verify OTP responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message:
                'No account associated with this email address was found.',
            },
          },
          Second: {
            summary: 'Invalid OTP',
            value: {
              success: false,
              statuscode: 0,
              message: 'Please enter a valid OTP.',
            },
          },
          Third: {
            summary: 'OTP verified successfully',
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
    dto: VerifyOtpDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_admin = await this.authService.findVerifyEmailAddress(dto);

    if (!find_admin) {
      return errorRes(
        res,
        i18n.t(
          'common.No account associated with this email address was found.'
        )
      );
    }

    const data = await this.authService.verifyOtp(dto);

    if (!data) {
      return errorRes(res, i18n.t('common.Please enter a valid OTP.'));
    }

    return successRes(res, i18n.t('common.OTP verified successfully.'), null);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Reset password responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Email not found',
            value: {
              success: false,
              statuscode: 0,
              message:
                'No account associated with this email address was found.',
            },
          },
          Second: {
            summary: 'Password reset successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Your password has been successfully reset.',
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
    dto: ResetPasswordDto,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_admin = await this.authService.findEmailAddress(dto);
    if (!find_admin) {
      return errorRes(
        res,
        i18n.t(
          'common.No account associated with this email address was found.'
        )
      );
    }

    await this.authService.resetPassword(dto);

    return successRes(
      res,
      i18n.t('common.Your password has been successfully reset.'),
      null
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Logout responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'User not found',
            value: {
              success: false,
              statuscode: 0,
              message: 'User not found.',
            },
          },
          Second: {
            summary: 'Logout successfully',
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
    @CurrentUser()
    user: IUser & { _id: Types.ObjectId; token?: string | null },
    @Req() req: Request,
    @Res() res: Response,
    @I18n() i18n: I18nContext
  ) {
    const find_admin = await this.authService.findUser({ _id: user._id });

    if (!find_admin) {
      return errorRes(res, i18n.t('common.User not found.'));
    }

    const rawHeader = req.get('authorization') ?? '';
    const token = rawHeader.startsWith('Bearer ')
      ? rawHeader.slice(7)
      : rawHeader;

    await this.authService.logout({
      _id: String(user._id),
      token,
    });
    return successRes(
      res,
      i18n.t('common.You have successfully logged out.'),
      null
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @ApiResponse({
    status: 200,
    description: 'Dashboard responses',
    content: {
      'application/json': {
        examples: {
          First: {
            summary: 'Data loaded successfully',
            value: {
              success: true,
              statuscode: 1,
              message: 'Data has been successfully loaded.',
              data: {
                users: 2,
              },
            },
          },
        },
      },
    },
  })
  @Post('dashboard')
  async dashboard(@Res() res: Response, @I18n() i18n: I18nContext) {
    const data = await this.authService.dashboard();
    return successRes(
      res,
      i18n.t('common.Data has been successfully loaded.'),
      data
    );
  }
}
