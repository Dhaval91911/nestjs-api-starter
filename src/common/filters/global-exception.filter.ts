import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
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
