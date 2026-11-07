import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBulkEmailsHandler } from './application/commands/create-bulk-emails/create-bulk-emails.handler';
import { CreateEmailHandler } from './application/commands/create-email/create-email.handler';
import { EMAIL_REPOSITORY } from './application/port/repositories/email.repository.port';
import { EMAIL_SENDER } from './application/port/smtp/email-sender.port';
import { GetEmailHandler } from './application/queries/get-email/get-email.handler';
import { EmailDeliveryWorker } from './application/workers/email-delivery.worker';
import { TypeOrmEmailRepository } from './infrastructure/adapter/email.repository.adapter';
import { SmtpEmailSenderAdapter } from './infrastructure/adapter/smtp-email-sender.adapter';
import { EmailOrmEntity } from './infrastructure/persistence/typeorm/entities/email.orm-entity';
import { EmailController } from './presentation/http/email.controller';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([EmailOrmEntity])],
  controllers: [EmailController],
  providers: [
    TypeOrmEmailRepository,
    {
      provide: EMAIL_REPOSITORY,
      useExisting: TypeOrmEmailRepository,
    },
    SmtpEmailSenderAdapter,
    {
      provide: EMAIL_SENDER,
      useExisting: SmtpEmailSenderAdapter,
    },
    CreateEmailHandler,
    CreateBulkEmailsHandler,
    GetEmailHandler,
    EmailDeliveryWorker,
  ],
  exports: [EmailDeliveryWorker],
})
export class EmailModule {}
