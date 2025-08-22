import { createCipheriv, createDecipheriv } from 'crypto';

interface CryptoConfig {
  algorithm: string;
  initVector: string;
  securityKey: string;
}

const cryptoConfig: CryptoConfig = {
  algorithm: process.env.ALGORITHM as string,
  initVector: process.env.INITVECTOR as string,
  securityKey: process.env.SECURITYKEY as string,
};

export function securePassword(password: string): string {
  const cipher = createCipheriv(
    cryptoConfig.algorithm,
    cryptoConfig.securityKey,
    cryptoConfig.initVector
  );
  let encryptedData = cipher.update(password, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}

export function decryptPassword(password: string): string {
  const decipher = createDecipheriv(
    cryptoConfig.algorithm,
    cryptoConfig.securityKey,
    cryptoConfig.initVector
  );
  let decryptedData = decipher.update(password, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

export function comparePassword(password: string, dbPassword: string): boolean {
  const original = decryptPassword(dbPassword);
  return original === password;
}
