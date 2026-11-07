import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LokiLoggerService } from './loki-logger.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpObservabilityMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LokiLoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.originalUrl.startsWith('/metrics')) {
      next();
      return;
    }

    const startedAt = process.hrtime.bigint();

    response.once('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      const route = request.route?.path
        ? `${request.baseUrl}${request.route.path}`
        : request.path;

      this.metricsService.recordHttpRequest(
        request.method,
        route,
        response.statusCode,
        durationSeconds,
      );
      this.logger.log(
        `${request.method} ${route} ${response.statusCode}`,
        'HttpRequest',
      );
    });

    next();
  }
}
