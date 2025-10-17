import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface StandardResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((body: unknown) => {
        if (body && typeof body === 'object' && 'success' in body) {
          return body as StandardResponse<T>;
        }
        return { success: true, data: body } as StandardResponse<T>;
      })
    );
  }
}
