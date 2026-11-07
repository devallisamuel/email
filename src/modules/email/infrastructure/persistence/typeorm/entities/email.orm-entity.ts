import { EmailStatusType } from '../../../../domain/value-object/email-status.vo';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'emails' })
export class EmailOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  sender!: string;

  @Column({ type: 'varchar', length: 320 })
  recipient!: string;

  @Column({ type: 'varchar', length: 998 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({
    type: 'enum',
    enum: EmailStatusType,
    enumName: 'email_status_type',
    default: EmailStatusType.PENDING,
  })
  status!: EmailStatusType;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({
    name: 'next_attempt_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  nextAttemptAt!: Date;

  @Column({ name: 'processing_started_at', type: 'timestamptz', nullable: true })
  processingStartedAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({
    name: 'provider_message_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerMessageId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;
}
