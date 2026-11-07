import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_REPOSITORY } from '../port/repositories/email.repository.port';
import type { EmailRepository } from '../port/repositories/email.repository.port';
import { EMAIL_SENDER } from '../port/smtp/email-sender.port';
import type { EmailSender } from '../port/smtp/email-sender.port';
import { EmailEntity } from '../../domain/entity/email.entity';

@Injectable()
export class EmailDeliveryWorker implements OnApplicationShutdown {
  private readonly logger = new Logger(EmailDeliveryWorker.name);
  private stopping = false;

  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly emailRepository: EmailRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    private readonly configService: ConfigService,
  ) {}

  async run(): Promise<void> {
    const batchSize = this.positiveInteger('EMAIL_WORKER_BATCH_SIZE', 10);
    const idleDelayMs = this.positiveInteger(
      'EMAIL_WORKER_IDLE_DELAY_MS',
      1_000,
    );
    const leaseMs = this.positiveInteger('EMAIL_WORKER_LEASE_MS', 300_000);

    this.logger.log('Email delivery worker started.');

    while (!this.stopping) {
      try {
        const recovered = await this.emailRepository.recoverExpiredClaims(
          new Date(Date.now() - leaseMs),
        );

        if (recovered > 0) {
          this.logger.warn(`Recovered ${recovered} expired email claim(s).`);
        }

        const emails = await this.emailRepository.claimPendingBatch(batchSize);

        if (emails.length === 0) {
          await this.sleep(idleDelayMs);
          continue;
        }

        for (const email of emails) {
          if (this.stopping) {
            break;
          }

          await this.deliver(email);
        }
      } catch (error) {
        this.logger.error(
          `Email worker loop failed: ${this.errorMessage(error)}`,
        );
        await this.sleep(idleDelayMs);
      }
    }

    this.logger.log('Email delivery worker stopped.');
  }

  onApplicationShutdown(): void {
    this.stopping = true;
  }

  private async deliver(email: EmailEntity): Promise<void> {
    try {
      const providerMessageId = await this.emailSender.send(email);
      await this.emailRepository.markCompleted(
        email.emailId,
        providerMessageId,
      );
      this.logger.log(`Email ${email.id} completed.`);
    } catch (error) {
      const errorMessage = this.errorMessage(error);
      const maxAttempts = this.positiveInteger('EMAIL_MAX_ATTEMPTS', 5);

      if (email.attempts >= maxAttempts) {
        await this.emailRepository.markFailed(email.emailId, errorMessage);
        this.logger.error(`Email ${email.id} failed permanently: ${errorMessage}`);
        return;
      }

      const nextAttemptAt = new Date(
        Date.now() + this.retryDelayMs(email.attempts),
      );
      await this.emailRepository.scheduleRetry(
        email.emailId,
        errorMessage,
        nextAttemptAt,
      );
      this.logger.warn(
        `Email ${email.id} will retry at ${nextAttemptAt.toISOString()}: ${errorMessage}`,
      );
    }
  }

  private positiveInteger(name: string, fallback: number): number {
    const value = this.configService.get<string>(name);

    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error(`${name} must be a positive integer.`);
    }

    return parsed;
  }

  private retryDelayMs(attempt: number): number {
    const oneMinute = 60_000;
    const oneHour = 60 * oneMinute;

    return Math.min(oneMinute * 2 ** Math.max(attempt - 1, 0), oneHour);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
