import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable()
export class LokiLoggerService implements LoggerService {
  private readonly lokiUrl?: string;
  private readonly serviceName: string;
  private readonly component: string;

  constructor(configService: ConfigService) {
    this.lokiUrl = configService.get<string>('LOKI_URL');
    this.serviceName = configService.get<string>('LOKI_SERVICE_NAME') ?? 'email-service';
    this.component = configService.get<string>('APP_COMPONENT') ?? 'api';
  }

  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.write('error', message, context, stack);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      component: this.component,
      context,
      message: this.toMessage(message),
      ...(stack ? { stack } : {}),
    };

    process.stdout.write(`${JSON.stringify(entry)}\n`);

    if (!this.lokiUrl) {
      return;
    }

    const labels = {
      service: this.serviceName,
      component: this.component,
      level,
    };
    const timestamp = (BigInt(Date.now()) * 1_000_000n).toString();
    const payload = {
      streams: [{ stream: labels, values: [[timestamp, JSON.stringify(entry)]] }],
    };

    void fetch(this.lokiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2_000),
    }).then((response) => {
      if (!response.ok) {
        process.stderr.write(`Loki log delivery failed: HTTP ${response.status}\n`);
      }
    }).catch((error: unknown) => {
      process.stderr.write(`Loki log delivery failed: ${this.toMessage(error)}\n`);
    });
  }

  private toMessage(value: unknown): string {
    if (value instanceof Error) {
      return value.message;
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
  }
}
