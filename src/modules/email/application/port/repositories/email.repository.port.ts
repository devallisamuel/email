import { EmailEntity } from 'src/modules/email/domain/entity/email.entity';
import { EmailId } from 'src/modules/email/domain/value-object/email-id.vo';


export const EMAIL_REPOSITORY = Symbol('EMAIL_REPOSITORY');

export interface EmailRepository {
  save(email: EmailEntity): Promise<EmailEntity>;
  saveMany(emails: EmailEntity[]): Promise<EmailEntity[]>;
  findById(id: EmailId): Promise<EmailEntity | null>;
  claimPendingBatch(limit: number): Promise<EmailEntity[]>
  markCompleted(id: EmailId, providerMessageId: string): Promise<void>
  scheduleRetry(id: EmailId, error: string, nextAttemptAt: Date): Promise<void>
  markFailed(id: EmailId, error: string): Promise<void>
  recoverExpiredClaims(leaseExpiredBefore: Date): Promise<number>
}
