/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Registry, collectDefaultMetrics } from 'prom-client';

// `prom-client` types expose untyped `any` fields which trigger strict ESLint rules.
// This wrapper instance is still safe because we control usage.

const register = new Registry();
// Strongly type the call to satisfy eslint no-unsafe-call
collectDefaultMetrics({ register });

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);

    res.end(await register.metrics());
  }
}
