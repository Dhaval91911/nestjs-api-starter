import { UserDocument } from '../user/user.schema';

declare module 'express' {
  export interface Request {
    user?: UserDocument;
  }
}
