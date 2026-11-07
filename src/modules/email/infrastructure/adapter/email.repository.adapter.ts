import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailRepository } from '../../application/port/repositories/email.repository.port';
import { EmailEntity } from '../../domain/entity/email.entity';
import { EmailId } from '../../domain/value-object/email-id.vo';
import { EmailStatus, EmailStatusType } from '../../domain/value-object/email-status.vo';
import { EmailOrmEntity } from '../persistence/typeorm/entities/email.orm-entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmEmailRepository implements EmailRepository {
  constructor(
    @InjectRepository(EmailOrmEntity)
    private readonly repository: Repository<EmailOrmEntity>,
  ) {}

  async save(email: EmailEntity): Promise<EmailEntity> {
    const savedEmail = await this.repository.save(this.toPersistence(email));

    return this.toDomain(savedEmail);
  }

  async saveMany(emails: EmailEntity[]): Promise<EmailEntity[]> {
    const savedEmails = await this.repository.save(
      emails.map((email) => this.toPersistence(email)),
    );

    return savedEmails.map((email) => this.toDomain(email));
  }

  async findById(id: EmailId): Promise<EmailEntity | null> {
    const email = await this.repository.findOneBy({ id: id.value });

    return email ? this.toDomain(email) : null;
  }

  async claimPendingBatch(limit: number = 500): Promise<EmailEntity[]> {
    const now = new Date();

    const claimedEmails = await this.repository.manager.transaction(
      async (manager) =>  {
        const repository = manager.getRepository(EmailOrmEntity);

        const emails = await repository.createQueryBuilder('email').where('email.status = :status', {
          status: EmailStatusType.PENDING
        })
        .andWhere('email.nextAttemptAt <= :now', { now })
        .orderBy('email.createdAt', 'ASC')
        .take(limit)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany();

        if (emails.length === 0) {
          return [];
        }

        const ids = emails.map((email) => email.id);

        await repository
          .createQueryBuilder()
          .update(EmailOrmEntity)
          .set({
            status: EmailStatusType.PROCESSING,
            attempts: () => '"attempts" + 1',
            processingStartedAt: now,
          })
          .whereInIds(ids)
          .execute();

        return emails.map((email) =>
          Object.assign(email, {
            status: EmailStatusType.PROCESSING,
            attempts: email.attempts + 1,
            processingStartedAt: now,
          }),
        );
      }
    )
    return claimedEmails.map((email) => this.toDomain(email));
  }

  async markCompleted(id: EmailId, providerMessageId: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(EmailOrmEntity);

      const email = await repository
        .createQueryBuilder('email')
        .where('email.id = :id', { id: id.value })
        .setLock('pessimistic_write')
        .getOne();

      if (!email) {
        throw new Error(`Email ${id.value} does not exist`);
      }

      if (email.status !== EmailStatusType.PROCESSING) {
        throw new Error(
          `Cannot complete email ${id.value} with status ${email.status}`,
        );
      }

      email.status = EmailStatusType.COMPLETED;
      email.providerMessageId = providerMessageId;
      email.deliveredAt = new Date();
      email.processingStartedAt = null;
      email.lastError = null;

      await repository.save(email);
    });
  }

  async scheduleRetry(
    id: EmailId,
    error: string,
    nextAttemptAt: Date,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(EmailOrmEntity);

      const email = await repository
        .createQueryBuilder('email')
        .where('email.id = :id', { id: id.value })
        .setLock('pessimistic_write')
        .getOne();

      if (!email) {
        throw new Error(`Email ${id.value} does not exist`);
      }

      if (email.status !== EmailStatusType.PROCESSING) {
        throw new Error(
          `Cannot schedule a retry for email ${id.value} with status ${email.status}`,
        );
      }

      email.status = EmailStatusType.PENDING;
      email.nextAttemptAt = nextAttemptAt;
      email.processingStartedAt = null;
      email.lastError = error.slice(0, 2_000);

      await repository.save(email);
    });
  }

  async markFailed(id: EmailId, error: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(EmailOrmEntity);

      const email = await repository
        .createQueryBuilder('email')
        .where('email.id = :id', { id: id.value })
        .setLock('pessimistic_write')
        .getOne();

      if (!email) {
        throw new Error(`Email ${id.value} does not exist`);
      }

      if (email.status !== EmailStatusType.PROCESSING) {
        throw new Error(
          `Cannot fail email ${id.value} with status ${email.status}`,
        );
      }

      email.status = EmailStatusType.FAILED;
      email.processingStartedAt = null;
      email.lastError = error.slice(0, 2_000);

      await repository.save(email);
    });
  }

  async recoverExpiredClaims(leaseExpiredBefore: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(EmailOrmEntity)
      .set({
        status: EmailStatusType.PENDING,
        processingStartedAt: null,
        nextAttemptAt: new Date(),
        lastError: 'Delivery worker lease expired before the email was sent.',
      })
      .where('status = :status', { status: EmailStatusType.PROCESSING })
      .andWhere('processing_started_at < :leaseExpiredBefore', {
        leaseExpiredBefore,
      })
      .execute();

    return result.affected ?? 0;
  }

  private toPersistence(email: EmailEntity): EmailOrmEntity {
    return this.repository.create({
      id: email.id,
      sender: email.sender,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status.status,
      attempts: email.attempts,
      nextAttemptAt: email.nextAttemptAt,
      processingStartedAt: email.processingStartedAt,
      lastError: email.lastError,
      providerMessageId: email.providerMessageId,
      createdAt: email.createdAt,
      deliveredAt: email.deliveredAt,
    });
  }

  private toDomain(email: EmailOrmEntity): EmailEntity {
    return EmailEntity.create({
      id: EmailId.create(email.id),
      sender: email.sender,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: EmailStatus.from(email.status),
      attempts: email.attempts,
      nextAttemptAt: email.nextAttemptAt,
      processingStartedAt: email.processingStartedAt,
      lastError: email.lastError,
      providerMessageId: email.providerMessageId,
      createdAt: email.createdAt,
      deliveredAt: email.deliveredAt,
    });
  }
}
