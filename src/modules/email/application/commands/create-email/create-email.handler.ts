import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { EMAIL_REPOSITORY } from '../../port/repositories/email.repository.port';
import type { EmailRepository } from '../../port/repositories/email.repository.port';
import { EmailEntity } from '../../../domain/entity/email.entity';
import { EmailId } from '../../../domain/value-object/email-id.vo';
import { EmailStatus } from '../../../domain/value-object/email-status.vo';
import { CreateEmailCommand } from './create-email.command';
import { ConfigService } from '@nestjs/config';

@CommandHandler(CreateEmailCommand)
export class CreateEmailHandler
  implements ICommandHandler<CreateEmailCommand, EmailEntity>
{
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly emailRepository: EmailRepository,
    private configService: ConfigService
  ) {}

  async execute(command: CreateEmailCommand): Promise<EmailEntity> {
    const email = EmailEntity.create({
      id: EmailId.create(randomUUID()),
      sender: this.configService.getOrThrow<string>('EMAIL_FROM'),
      recipient: command.recipient,
      subject: command.subject,
      body: command.body,
      status: EmailStatus.pending(),
      attempts: 0,
      nextAttemptAt: new Date(),
      processingStartedAt: null,
      lastError: null,
      providerMessageId: null,
      createdAt: new Date(),
      deliveredAt: null,
    });

    return this.emailRepository.save(email);
  }
}
