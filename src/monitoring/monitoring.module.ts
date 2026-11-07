import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpObservabilityMiddleware } from './http-observability.middleware';
import { LokiLoggerService } from './loki-logger.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [LokiLoggerService, MetricsService, HttpObservabilityMiddleware],
  exports: [LokiLoggerService, MetricsService],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpObservabilityMiddleware).forRoutes('*');
  }
}
