// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/users.repository';
import { User } from '../../../models/users.model';
import {
  changePasswordDto,
  deleteUserDto,
  deleteUserSessionsDto,
  forgetPasswordDto,
  resetPasswordDto,
  updateUserDto,
  verifyOtpDto,
} from './dto/users.dto';
import { EmailService } from '../../../utils/email.utils';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async findUser(user_id: string): Promise<User | null> {
    return this.userRepository.findById(user_id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(userData: updateUserDto): Promise<User | null> {
    return this.userRepository.update(userData);
  }

  async changePassword(userData: changePasswordDto): Promise<User | null> {
    return this.userRepository.changePassword(userData);
  }

  async delete(userData: deleteUserDto): Promise<User | null> {
    return this.userRepository.delete(userData);
  }

  async forgetPassword(data: forgetPasswordDto): Promise<boolean> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      return false;
    }
    const otp: number = Math.floor(1000 + Math.random() * 9000);

    await this.emailService.sendPasswordResetEmail(user.name, user.email, otp);

    await this.userRepository.updateUserData(String(user?._id), { otp });
    return true;
  }

  async verifyOtp(data: verifyOtpDto): Promise<boolean> {
    const user = await this.userRepository.findByEmail(data.email);

    if (user?.otp != data.otp) {
      return true;
    } else {
      return false;
    }
  }

  async resetPassword(data: resetPasswordDto): Promise<User | null> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      return null; // User not found
    }

    // Update the password
    return this.userRepository.changePassword({
      user_id: user._id,
      new_password: data.new_password,
    });
  }

  async logout(data: deleteUserSessionsDto): Promise<boolean> {
    await this.userRepository.deleteSessions(data);
    return true; // Placeholder for actual logout logic
  }
}
