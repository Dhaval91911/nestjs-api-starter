import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../../models/users.model';
import { UserSession } from '../../../../models/user_sessions.model';
import { CreateUserSessionDto, SignUpDto } from '../dto/auth.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSession.name) private userSessionModel: Model<UserSession>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email, userType: 'admin', is_deleted: false })
      .exec();
  }

  async findById(user_id: string): Promise<UserDocument | null> {
    return this.userModel.findById(user_id).where({ is_deleted: false }).exec();
  }

  async create(userData: SignUpDto): Promise<UserDocument> {
    const data = {
      ...userData,
      userType: 'admin',
    };
    const newUser = new this.userModel(data);
    return newUser.save();
  }

  async createUserSession(
    createUserSessionData: CreateUserSessionDto,
  ): Promise<UserSession> {
    const { user_id, device_token, device_type } = createUserSessionData;

    const existingSession = await this.userSessionModel.findOne({
      user_id,
      device_token,
      device_type,
    });

    if (existingSession) {
      // Update the existing session with the new auth token
      existingSession.auth_token = createUserSessionData.auth_token;
      return existingSession.save();
    } else {
      // Create a new session
      const createdUser = new this.userSessionModel(createUserSessionData);
      return createdUser.save();
    }
  }
}
