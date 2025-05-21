// src/auth/auth.controller.ts
import { Controller, Post, Body, UseInterceptors, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { generateToken } from './strategies/jwt.strategy';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { LoggingInterceptor } from '../../../shared/interceptors/logging.interceptor';
import {
  Response,
  sendSuccess,
  sendError,
  ApiResponse,
} from '../../../common/responses';
import { User, UserDocument } from '../../../models/users.model';
import { Types } from 'mongoose';

@UseInterceptors(LoggingInterceptor)
@Controller('v1/app/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign_up')
  async create(
    @Body() data: SignUpDto,
    @Res() res: Response,
  ): Promise<ApiResponse<User & { token: string }>> {
    const checkEmail = await this.authService.checkEmail(data.email);

    if (checkEmail) {
      return sendError(res, 400, 'Email already exists');
    }

    const createUser = await this.authService.create(data);
    if (createUser) {
      const token: string = generateToken({
        user_id: createUser._id as string,
      });

      await this.authService.createUserSession({
        ...data,
        auth_token: token,
        user_id: new Types.ObjectId(createUser._id),
      });

      const useData = createUser.toObject() as User;

      return sendSuccess(res, 'Registration successfully', {
        ...useData,
        token,
      });
    } else {
      return sendError(res, 400, 'Failed to sign up');
    }
  }

  @Post('sign_in')
  async signIn(
    @Body() data: SignInDto,
    @Res() res: Response,
  ): Promise<ApiResponse<User>> {
    const findUser: UserDocument | null = await this.authService.checkEmail(
      data.email,
    );

    if (!findUser) {
      return sendError(res, 400, 'Email not found');
    }

    if (findUser.password !== data.password) {
      return sendError(res, 400, 'Wrong password');
    }

    const token: string = generateToken({
      user_id: findUser._id as string,
    });

    await this.authService.createUserSession({
      ...data,
      auth_token: token,
      user_id: new Types.ObjectId(findUser._id),
    });

    const userData = findUser.toObject() as User; // This should work now

    return sendSuccess(res, 'Login successfully', {
      ...userData,
      token,
    });
  }
}
