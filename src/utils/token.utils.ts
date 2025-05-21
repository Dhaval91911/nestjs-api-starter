import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'helirbn@12ih2jnei3n2883!nfbb';
const JWT_EXPIRES_IN = '30d'; // Change as needed (e.g., '7d', '15m')

/**
 * Generates a JWT token with given payload
 * @param payload - Object containing data to be encoded in the token
 * @returns A signed JWT token
 */
export function generateToken(payload: Record<string, any>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token to verify
 * @returns The decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
