import { NestFactory } from '@nestjs/core';
import { EmailDeliveryWorker } from './modules/email/application/workers/email-delivery.worker';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.enableShutdownHooks();

  const worker = app.get(EmailDeliveryWorker);

  await worker.run();
  await app.close();
}

void bootstrap();
