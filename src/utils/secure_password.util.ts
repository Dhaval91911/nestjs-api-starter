/**
 * Password hashing helpers using `bcrypt`.
 *
 * Environment variable: `BCRYPT_SALT_ROUNDS` (defaults to 12)
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param password - Plain user password.
 * @returns bcrypt hash string.
 */
export async function securePassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 *
 * @param password - Plain password provided by user.
 * @param hash - Previously hashed password stored in DB.
 * @returns `true` if match else `false`.
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
