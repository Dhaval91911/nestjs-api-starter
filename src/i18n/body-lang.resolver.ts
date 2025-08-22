import { I18nResolver } from 'nestjs-i18n';
import { ExecutionContext } from '@nestjs/common';

export class BodyLangResolver implements I18nResolver {
  constructor(private readonly options: string[] = ['ln']) {}

  resolve(context: ExecutionContext): string | string[] | undefined {
    const req = context
      .switchToHttp()
      .getRequest<{ body?: Record<string, unknown> }>();
    const ln = req.body?.ln;
    if (typeof ln === 'string') return ln;
    if (Array.isArray(ln) && ln.every((v) => typeof v === 'string')) return ln;
    return undefined;
  }
}
