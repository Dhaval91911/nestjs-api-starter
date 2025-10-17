/**
 * JWT token utilities.
 *
 * Reads configuration from environment variables validated by `validation.schema.ts`:
 * - `TOKEN_KEY` (secret, required)
 * - `TOKEN_EXPIRES_IN` (e.g. "1h", defaults to 1h)
 * - `TOKEN_ISSUER` (token issuer string)
 * - `TOKEN_AUDIENCE` (token audience string)
 */
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

const TOKEN_SECRET = process.env.TOKEN_KEY as string;
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN ?? '1h';
const TOKEN_ISSUER = process.env.TOKEN_ISSUER ?? 'pet-api';
const TOKEN_AUDIENCE = process.env.TOKEN_AUDIENCE ?? 'pet-app';

/**
 * Generate a signed JWT for a user id.
 *
 * @param id - Mongo ObjectId or string user identifier.
 * @returns Signed JWT as string.
 * @throws Error if `TOKEN_KEY` is not configured.
 */
export const userToken = (id: Types.ObjectId | string): string => {
  if (!TOKEN_SECRET) {
    throw new Error('TOKEN_KEY environment variable is not set');
  }
  return jwt.sign(
    { id },
    TOKEN_SECRET as jwt.Secret,
    {
      expiresIn: TOKEN_EXPIRES_IN,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    } as jwt.SignOptions
  );
};

/**
 * Generate an opaque refresh token and a bcrypt hash for storage.
 * Default TTL is 30 days unless REFRESH_TOKEN_TTL_DAYS specified.
 */
export async function generateRefreshToken(): Promise<{
  refreshToken: string;
  refreshTokenHash: string;
  expiresAt: Date;
}> {
  const bytes = randomBytes(48);
  const refreshToken = bytes.toString('base64url');
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const refreshTokenHash = await bcrypt.hash(refreshToken, rounds);
  const ttlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  return { refreshToken, refreshTokenHash, expiresAt };
}
