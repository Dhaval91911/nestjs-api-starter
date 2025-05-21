// src/modules/users/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../../models/users.model';
import { UserSession } from '../../../../models/user_sessions.model';
import {
  changePasswordDto,
  deleteUserDto,
  deleteUserSessionsDto,
  updateUserDto,
} from '../dto/users.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('UserSession') private UserSessionModel: Model<UserSession>,
  ) {}

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel
      .findOne({
        email: email,
      })
      .exec();
  }

  async update(userData: updateUserDto): Promise<User | null> {
    const { user_id, name } = userData;

    return this.userModel
      .findByIdAndUpdate(user_id, { name }, { new: true })
      .exec();
  }

  async changePassword(userData: changePasswordDto): Promise<User | null> {
    const { user_id, new_password } = userData;

    return this.userModel
      .findByIdAndUpdate(user_id, { password: new_password }, { new: true })
      .exec();
  }

  async delete(userData: deleteUserDto): Promise<User | null> {
    const { user_id } = userData;

    return this.userModel
      .findByIdAndUpdate(user_id, { is_deleted: true }, { new: true })
      .exec();
  }

  async deleteSessions(userData: deleteUserSessionsDto): Promise<User | null> {
    const { user_id, auth_token } = userData;

    console.log(userData);

    await this.UserSessionModel.deleteOne({
      user_id: user_id,
      auth_token: auth_token,
    });
    return null;
  }

  async updateUserData(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec(); // Update OTP
  }
}
