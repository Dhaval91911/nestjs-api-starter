// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/auth.repositories';
import { SignUpDto, CreateUserSessionDto } from './dto/auth.dto';
import { User, UserDocument } from '../../../models/users.model';
import { UserSession } from '../../../models/user_sessions.model';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async findUser(user_id: string): Promise<User | null> {
    return this.userRepository.findById(user_id);
  }

  async checkEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(userData: SignUpDto): Promise<UserDocument> {
    return this.userRepository.create(userData);
  }

  // async update(userData: updateUserDto): Promise<User | null> {
  //   return this.userRepository.update(userData);
  // }

  // async changePassword(userData: changePasswordDto): Promise<User | null> {
  //   return this.userRepository.changePassword(userData);
  // }

  // async delete(userData: deleteUserDto): Promise<User | null> {
  //   return this.userRepository.delete(userData);
  // }

  async createUserSession(
    createUserSessionData: CreateUserSessionDto,
  ): Promise<UserSession> {
    return this.userRepository.createUserSession(createUserSessionData);
  }
}
