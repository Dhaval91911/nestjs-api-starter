import 'dotenv/config';
import { webcrypto as nodeCrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto as unknown as Crypto;
}
import { NestFactory } from '@nestjs/core';
import { Request } from 'express';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(
      helmet({
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        hsts: false,
        contentSecurityPolicy: false,
      })
    );
  } else {
    app.use(helmet());
  }
  app.enableCors({
    origin: true,
    credentials: true,
  });
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

  morgan.token('host', (req: Request) => req.hostname);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.use(
    morgan(
      ':method :host :url :status :res[content-length] - :response-time ms'
    )
  );

  const config = new DocumentBuilder()
    .setTitle('API Postman collection for Project Name')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('postman', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  const url = await app.getUrl();
  console.log(`✅ Application is running on: ${url}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}
void bootstrap();
