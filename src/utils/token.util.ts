import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const userToken = (id: Types.ObjectId | string): string => {
  if (!process.env.TOKEN_KEY) {
    throw new Error('TOKEN_KEY environment variable is not set');
  }
  return jwt.sign({ id }, process.env.TOKEN_KEY);
};
