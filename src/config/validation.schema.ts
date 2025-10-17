import * as Joi from 'joi';

// Centralized environment variable validation
// Extend or tighten as new variables are introduced.
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),

  // MongoDB
  MONGODB_URI: Joi.string().uri().required(),
  MONGODB_USER: Joi.string().optional(),
  MONGODB_PASSWORD: Joi.string().optional(),
  MONGODB_AUTH_SOURCE: Joi.string().optional(),
  MONGODB_TLS: Joi.boolean().optional(),

  // Throttler
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // CORS
  CORS_ORIGINS: Joi.string().optional(),

  // JWT
  TOKEN_KEY: Joi.string().required(),
  TOKEN_EXPIRES_IN: Joi.string().default('1d'),
  TOKEN_ISSUER: Joi.string().default('pet-api'),
  TOKEN_AUDIENCE: Joi.string().default('pet-app'),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(90).default(30),

  // Security
  USE_CSRF: Joi.string().valid('true', 'false').default('false'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  // S3/Bucket
  BUCKET_NAME: Joi.string().optional(),
  BUCKET_ENV: Joi.string().optional(),
  BUCKET_URL: Joi.string().uri().optional(),

  // Mailer
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_FROM_ADDRESS: Joi.string().email({ tlds: false }).optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  SUPPORT_MAIL: Joi.string().email({ tlds: false }).optional(),
  APP_LOGO: Joi.string().uri().optional(),

  // Redis (for future socket.io adapter)
  REDIS_URL: Joi.string().uri().optional(),
});
