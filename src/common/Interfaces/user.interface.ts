import { Request } from 'express';
import { Role } from '../enums/roles.enum';
import { User } from '../../models/users.model';

export interface MockUser {
  username: string;
  role: Role;
}

export interface signInData {
  name: string;
  email: string;
  password?: string;
  token?: string;
}

export interface RequestUser {
  _id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: User;
  token?: string;
}

export interface ChangePasswordParams {
  newPassword: string;
}
