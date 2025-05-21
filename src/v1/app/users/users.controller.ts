// src/modules/users/users.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Res,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './users.service';
import {
  changePasswordDto,
  deleteUserDto,
  forgetPasswordDto,
  resetPasswordDto,
  verifyOtpDto,
} from './dto/users.dto';
import { AuthRequest } from '../../../common/Interfaces/user.interface';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../common/enums/roles.enum';
import { ApiTags } from '@nestjs/swagger';
import { updateUserDto } from './dto/users.dto';
import { User } from '../../../models/users.model';
import { RolesGuard } from '../../../middlewares/auth.guard';
import {
  Response,
  sendSuccess,
  sendError,
  ApiResponse,
} from '../../../common/responses';

@Controller('v1/app/user')
@ApiTags('user')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  // @Post(`change_password`)
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({ status: 200, description: 'List of users' })
  // async changePassword(@Body() data: changePasswordDto, @Req() req: AuthRequest, @Res() res: Response): Promise<ApiResponse<User>> {
  //   let {
  //     user_id,
  //     current_password
  //   } = data;

  //   let findUserData = await this.userService.findUser(String(user_id));

  //   if (findUserData?.password != current_password) {
  //     return await sendError(res, 400, 'Current password is wrong');
  //   }

  //   const updatedUser = await this.userService.update(data);

  //   if (!updatedUser) {
  //     return await sendError(res, 400, 'Failed to change password');
  //   }

  //   return await sendSuccess(res, 'Password changed successfully', updatedUser);
  // }

  @Roles(Role.User)
  @Patch('update_profile')
  async updateProfile(
    @Body() data: updateUserDto,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<ApiResponse<User | null>> {
    data.user_id = req.user._id;

    const updatedUser = await this.userService.update(data);
    if (!updatedUser) {
      return sendError(res, 400, 'Failed to update profile');
    }
    return sendSuccess(res, 'Profile updated successfully', updatedUser);
  }

  @Post('change_password')
  async changePassword(
    @Body() data: changePasswordDto,
    @Res() res: Response,
  ): Promise<ApiResponse<User>> {
    const { user_id, current_password } = data;

    const findUserData = await this.userService.findUser(String(user_id));

    if (findUserData?.password != current_password) {
      return sendError(res, 400, 'Current password is wrong');
    }

    const updatedUser = await this.userService.update(data);
    if (!updatedUser) {
      return sendError(res, 400, 'Failed to change password');
    }
    return sendSuccess(res, 'Password changed successfully', updatedUser);
  }

  @Roles(Role.User)
  @Delete('delete_account')
  async deleteAccount(
    @Body() data: deleteUserDto,
    @Res() res: Response,
  ): Promise<ApiResponse<User>> {
    const deletedUser = await this.userService.delete(data);
    if (!deletedUser) {
      return sendError(res, 400, 'Failed to delete account');
    }
    return sendSuccess(res, 'Account deleted successfully', deletedUser);
  }

  // src/modules/users/users.controller.ts
  @Post('forget_password')
  async forgetPassword(
    @Body() data: forgetPasswordDto,
    @Res() res: Response,
  ): Promise<ApiResponse<boolean>> {
    const result = await this.userService.forgetPassword(data);
    if (!result) {
      return sendError(res, 400, 'Failed to send OTP or user not found');
    }
    return sendSuccess(res, 'OTP sent to email successfully', result);
  }

  @Post('verify_otp')
  async verifyOtp(
    @Body() data: verifyOtpDto,
    @Res() res: Response,
  ): Promise<ApiResponse<boolean>> {
    const result = await this.userService.verifyOtp(data);
    if (!result) {
      return sendError(res, 400, 'Invalid OTP or email');
    }
    return sendSuccess(res, 'OTP verified successfully', result);
  }

  @Post('reset_password')
  async resetPassword(
    @Body() data: resetPasswordDto,
    @Res() res: Response,
  ): Promise<ApiResponse<User | null>> {
    const updatedUser = await this.userService.resetPassword(data);
    if (!updatedUser) {
      return sendError(res, 400, 'Failed to reset password');
    }
    return sendSuccess(res, 'Password reset successfully', updatedUser);
  }

  @Roles(Role.User)
  @Post('logout')
  async logout(
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<ApiResponse<User | null | boolean>> {
    const userId = req.user?._id;
    const authToken = req.token;

    if (!userId || !authToken) {
      return sendError(res, 400, 'User ID or auth token is missing');
    }

    const data = {
      user_id: userId,
      auth_token: authToken,
    };
    const result = await this.userService.logout(data);
    return sendSuccess(res, 'Logged out successfully', result);
  }

  @Get('/get_profile')
  @Roles(Role.User)
  async getUser(
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<ApiResponse<User | null | boolean>> {
    const userId = req.user?._id;
    const result = await this.userService.findUserById(String(userId));
    return sendSuccess(res, 'User data get successfully', result);
  }
  // @UseFilters(HttpExceptionFilter, AllExceptionsFilter)
  // getResource() {
  //   // throw new ForbiddenException('Test 🎁🎁🎁🎁🎁');
  //   return '👀 Viewing the resource';
  // }
}
