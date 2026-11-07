import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { EMAIL_REPOSITORY } from '../../port/repositories/email.repository.port';
import type { EmailRepository } from '../../port/repositories/email.repository.port';
import { EmailEntity } from '../../../domain/entity/email.entity';
import { EmailId } from '../../../domain/value-object/email-id.vo';
import { EmailStatus } from '../../../domain/value-object/email-status.vo';
import { CreateBulkEmailsCommand } from './create-bulk-emails.command';
import { ConfigService } from '@nestjs/config';

@CommandHandler(CreateBulkEmailsCommand)
export class CreateBulkEmailsHandler
  implements ICommandHandler<CreateBulkEmailsCommand, EmailEntity[]>
{
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly emailRepository: EmailRepository,
    private configService: ConfigService
  ) {}

  async execute(command: CreateBulkEmailsCommand): Promise<EmailEntity[]> {
    const createdAt = new Date();
    const emails = command.emails.map((email) =>
      EmailEntity.create({
        id: EmailId.create(randomUUID()),
        sender: this.configService.getOrThrow<string>('EMAIL_FROM'),
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: EmailStatus.pending(),
        attempts: 0,
        nextAttemptAt: createdAt,
        processingStartedAt: null,
        lastError: null,
        providerMessageId: null,
        createdAt,
        deliveredAt: null,
      }),
    );

    return this.emailRepository.saveMany(emails);
  }
}
