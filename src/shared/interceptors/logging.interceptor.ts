import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method: string = request.method;
    const url: string = request.url;
    const now = Date.now();

    console.log(`[Request] ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        console.log(`[Response] ${method} ${url} - ${ms}ms`);
      }),
    );
  }
}
