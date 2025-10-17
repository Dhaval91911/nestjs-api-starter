import 'dotenv/config';
import { webcrypto as nodeCrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto as unknown as Crypto;
}
import { NestFactory } from '@nestjs/core';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { startOtel } from './otel';

async function bootstrap() {
  startOtel();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const allowedOriginsEnv = process.env.CORS_ORIGINS ?? '';
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV !== 'production'
          ? false
          : {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'", 'https:'],
                connectSrc: ["'self'", 'https:', 'wss:'],
              },
            },
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 63072000, includeSubDomains: true, preload: true }
          : false,
    })
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  // Cookie parsing (required for CSRF if enabled)
  app.use(cookieParser());

  // Optional CSRF protection – enable if API uses cookies instead of Authorization header.
  if (process.env.USE_CSRF === 'true') {
    app.use(csurf({ cookie: true }));
  }

  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
    new I18nValidationPipe()
  );
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  // morgan.token('host', (req: Request) => req.hostname);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.use(
    // morgan(
    //   ':method :host :url :status :res[content-length] - :response-time ms'
    // )
    pinoHttp({
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers[set-cookie]',
        ],
        remove: true,
      },
      customProps: (req: unknown) => ({ host: (req as Request).hostname }),
      genReqId: (req: unknown, res: unknown) => {
        const existing =
          ((req as Request).headers['x-request-id'] as string) || undefined;
        if (existing) {
          (res as Response).setHeader('x-request-id', existing);
          return existing;
        }
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        (res as Response).setHeader('x-request-id', id);
        return id;
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle('API Postman collection for PET')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('postman', app, document, {
      swaggerOptions: { persistAuthorization: false },
    });
  }

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  const url = await app.getUrl();
  console.log(`✅ Application is running on: ${url}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
