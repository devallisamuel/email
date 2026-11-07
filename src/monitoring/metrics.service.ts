import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly requestsTotal = new Counter({
    name: 'email_api_http_requests_total',
    help: 'Total HTTP requests handled by the Email API.',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });
  private readonly requestDurationSeconds = new Histogram({
    name: 'email_api_http_request_duration_seconds',
    help: 'HTTP request duration in seconds for the Email API.',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry, prefix: 'email_api_' });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.requestsTotal.inc(labels);
    this.requestDurationSeconds.observe(labels, durationSeconds);
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
