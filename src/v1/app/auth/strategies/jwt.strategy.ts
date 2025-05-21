// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';

export interface TokenPayload {
  user_id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY || 'helirbn@12ih2jnei3n2883!nfbb',
    });
  }

  validate(payload: TokenPayload) {
    return { userId: payload.user_id };
  }
}

// Token generation function
export function generateToken(payload: TokenPayload): string {
  console.log(process.env.JWT_SECRET_KEY);
  return jwt.sign(
    payload,
    String(process.env.JWT_SECRET_KEY) as BufferEncoding,
    { algorithm: 'HS256' },
  );
}
