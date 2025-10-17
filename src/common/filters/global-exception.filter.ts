import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Keys that should be redacted if present in an object that will be logged.
const SENSITIVE_KEYS = [/password/i, /token/i, /secret/i, /authorization/i];
function redactSensitive(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitive);
  const clone: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((re) => re.test(k))) {
      clone[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      clone[k] = redactSensitive(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responsePayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let messageText = 'Internal server error';
    if (typeof responsePayload === 'string') {
      messageText = responsePayload;
    } else if (
      typeof responsePayload === 'object' &&
      responsePayload !== null &&
      'message' in responsePayload
    ) {
      const val = (responsePayload as { message?: unknown }).message;
      if (Array.isArray(val)) {
        messageText = val.join(', ');
      } else if (typeof val === 'string') {
        messageText = val;
      }
    }

    const errorResponse = {
      success: false,
      statuscode: status,
      message: messageText,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const stack =
      exception instanceof Error ? exception.stack : 'Unknown error';
    const isAuthExpected = status === 401 || status === 403;
    // In production, avoid logging potentially sensitive request bodies
    const safeBody = redactSensitive(request.body ?? {});
    const logPayload = {
      ...errorResponse,
      method: request.method,
      path: request.url,
      body: process.env.NODE_ENV === 'production' ? undefined : safeBody,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(logPayload)}`,
        stack
      );
    } else if (isAuthExpected) {
      this.logger.debug(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`
      );
    }

    response.status(status).json(errorResponse);
  }
}
