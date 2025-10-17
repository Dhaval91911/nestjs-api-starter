import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/models/users.model';
import { EmailVerification } from 'src/models/email_verifications.model';
import { UserSession } from 'src/models/user_sessions.model';
import { securePassword } from 'src/utils/secure_password.util';
import {
  findVerifyEmailAddressDto,
  findEmailAddressDto,
  findUserDto,
  AdminSignUpDto,
  SignInDto,
  ChangePasswordDto,
  SendOtpForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { userToken } from 'src/utils/token.util';
import { sendOtpForgotPasswordAdmin } from 'src/utils/mailer.util';

interface AuthenticatedUser {
  _id: string;
  token: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
    @InjectModel(EmailVerification.name)
    private emailVerificationModel: Model<EmailVerification>
  ) {}

  async findVerifyEmailAddress(dto: findVerifyEmailAddressDto) {
    const { email_address } = dto;
    const data = await this.emailVerificationModel.findOne({
      email_address: email_address,
      is_email_verified: true,
      is_deleted: false,
    });

    return data;
  }

  async findEmailAddress(dto: findEmailAddressDto) {
    const { email_address } = dto;

    const data = await this.userModel.findOne({
      email_address: email_address,
      user_type: 'admin',
      is_deleted: false,
    });

    return data;
  }

  async findUser(dto: findUserDto) {
    const { _id } = dto;

    const data = await this.userModel.findOne({
      _id: _id,
      is_deleted: false,
    });

    return data;
  }

  async signUp(dto: AdminSignUpDto) {
    const { full_name, email_address, password, device_token, device_type } =
      dto;

    const existingUser = await this.userModel.findOne({
      email_address: email_address,
      is_deleted: false,
    });
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    await this.emailVerificationModel.create({
      email_address: email_address,
      is_email_verified: true,
    });

    const hashedPassword = password
      ? await securePassword(password)
      : undefined;

    const insert_admin_data = {
      full_name: full_name,
      email_address: email_address,
      password: hashedPassword,
      user_type: 'admin',
    };

    const create_admin = await this.userModel.create(insert_admin_data);

    const token = userToken(create_admin._id);

    const insert_admin_session_data = {
      device_token: device_token,
      device_type: device_type,
      auth_token: token,
      user_id: create_admin._id,
      user_type: 'admin',
      is_login: true,
    };

    await this.userSessionModel.create(insert_admin_session_data);

    const response_data = {
      ...create_admin.toObject(),
      token: token,
    };

    return response_data;
  }

  async signIn(dto: SignInDto) {
    const { email_address, device_token, device_type } = dto;

    const find_admin = await this.userModel.findOne({
      email_address,
      user_type: 'admin',
      is_deleted: false,
    });

    if (!find_admin) {
      throw new Error('Admin account not found');
    }

    const token = userToken(find_admin._id);

    const insert_admin_session_data = {
      device_token,
      device_type,
      auth_token: token,
      user_id: find_admin._id,
      user_type: 'admin',
      is_login: true,
    };

    await this.userSessionModel.create(insert_admin_session_data);

    // remove sensitive field before returning
    const adminObj = find_admin.toObject();
    delete adminObj.password;

    const response_data = {
      ...adminObj,
      token,
    };

    return response_data;
  }

  async changePassword(dto: ChangePasswordDto, user: AuthenticatedUser) {
    const { _id, token } = user;
    const { new_password } = dto;

    const hashedPassword = await securePassword(new_password);

    await this.userModel.findByIdAndUpdate(_id, { password: hashedPassword });

    await this.userSessionModel.deleteMany({
      user_id: _id,
      auth_token: { $ne: token },
    });

    return true;
  }

  async sendOtpForgotPassword(dto: SendOtpForgotPasswordDto) {
    const { email_address } = dto;

    const otp = Math.floor(1000 + Math.random() * 8000);

    const data = {
      otp,
      emailAddress: email_address,
    };

    await sendOtpForgotPasswordAdmin(data);

    const update_data = {
      otp,
    };

    await this.emailVerificationModel.updateOne(
      {
        email_address: email_address,
        is_email_verified: true,
        is_deleted: false,
      },
      {
        $set: update_data,
      }
    );

    return otp;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email_address, otp } = dto;

    const find_admin = await this.findVerifyEmailAddress({ email_address });

    if (find_admin?.otp !== null && find_admin?.otp === otp) {
      const update_data = {
        otp: null,
      };

      await this.emailVerificationModel.updateOne(
        {
          email_address: email_address,
          is_email_verified: true,
          is_deleted: false,
        },
        {
          $set: update_data,
        }
      );

      return true;
    } else {
      return false;
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email_address, password } = dto;

    const hashedPassword = await securePassword(password);

    await this.userModel.updateOne(
      { email_address: email_address },
      { password: hashedPassword }
    );

    return true;
  }

  async logout(user: AuthenticatedUser) {
    const { _id, token } = user;

    await this.userSessionModel.deleteMany({
      user_id: _id,
      auth_token: token,
    });

    return true;
  }

  async dashboard() {
    const adminDashboard = {
      users: 0,
    };

    const [find_user_count] = await Promise.all([
      this.userModel.countDocuments({ user_type: 'user', is_deleted: false }),
    ]);

    const res_data = {
      ...adminDashboard,
      users: find_user_count,
    };

    return res_data;
  }
}
