import type { ConfigService } from '@nestjs/config';
import { EmailEntity } from '../../domain/entity/email.entity';
import { EmailId } from '../../domain/value-object/email-id.vo';
import { EmailStatus } from '../../domain/value-object/email-status.vo';
import type { EmailRepository } from '../port/repositories/email.repository.port';
import type { EmailSender } from '../port/smtp/email-sender.port';
import { EmailDeliveryWorker } from './email-delivery.worker';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

const createEmail = (attempts = 1): EmailEntity =>
  EmailEntity.create({
    id: EmailId.create('e2e-test-email-id'),
    sender: 'sender@example.com',
    recipient: 'recipient@example.com',
    subject: 'Test subject',
    body: 'Test body',
    status: EmailStatus.processing(),
    attempts,
    nextAttemptAt: new Date('2026-01-01T00:00:00.000Z'),
    processingStartedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastError: null,
    providerMessageId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deliveredAt: null,
  });

describe('EmailDeliveryWorker', () => {
  let emailRepository: jest.Mocked<EmailRepository>;
  let emailSender: jest.Mocked<EmailSender>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let worker: EmailDeliveryWorker;

  beforeEach(() => {
    emailRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findById: jest.fn(),
      claimPendingBatch: jest.fn(),
      markCompleted: jest.fn(),
      scheduleRetry: jest.fn(),
      markFailed: jest.fn(),
      recoverExpiredClaims: jest.fn(),
    };
    emailSender = { send: jest.fn() };
    configService = { get: jest.fn() };
    worker = new EmailDeliveryWorker(
      emailRepository,
      emailSender,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks an email completed after the provider accepts it', async () => {
    const email = createEmail();
    emailSender.send.mockResolvedValue('provider-message-id');

    await (worker as unknown as { deliver(email: EmailEntity): Promise<void> }).deliver(email);

    expect(emailRepository.markCompleted).toHaveBeenCalledWith(
      email.emailId,
      'provider-message-id',
    );
    expect(emailRepository.scheduleRetry).not.toHaveBeenCalled();
    expect(emailRepository.markFailed).not.toHaveBeenCalled();
  });

  it('schedules an exponential retry when the provider does not respond', async () => {
    const email = createEmail(2);
    const now = new Date('2026-11-07T03:00:00.000Z');
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
    emailSender.send.mockRejectedValue(new Error('SMTP connection timed out'));

    await (worker as unknown as { deliver(email: EmailEntity): Promise<void> }).deliver(email);

    expect(emailRepository.scheduleRetry).toHaveBeenCalledWith(
      email.emailId,
      'SMTP connection timed out',
      new Date('2026-11-07T03:02:00.000Z'),
    );
    expect(emailRepository.markCompleted).not.toHaveBeenCalled();
    expect(emailRepository.markFailed).not.toHaveBeenCalled();
  });

  it('marks an email failed after its final allowed attempt', async () => {
    const email = createEmail(5);
    configService.get.mockImplementation((name: string) =>
      name === 'EMAIL_MAX_ATTEMPTS' ? '5' : undefined,
    );
    emailSender.send.mockRejectedValue(new Error('SMTP rejected credentials'));

    await (worker as unknown as { deliver(email: EmailEntity): Promise<void> }).deliver(email);

    expect(emailRepository.markFailed).toHaveBeenCalledWith(
      email.emailId,
      'SMTP rejected credentials',
    );
    expect(emailRepository.scheduleRetry).not.toHaveBeenCalled();
  });
});
