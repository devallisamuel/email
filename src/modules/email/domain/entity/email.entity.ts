import { Entity } from 'src/shared/domain/entity/shared.entity';
import { EmailId } from '../value-object/email-id.vo';
import { EmailStatus } from '../value-object/email-status.vo';


type EmailProps = {
  id: EmailId;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  attempts: number;
  nextAttemptAt: Date;
  processingStartedAt: Date | null;
  lastError: string | null;
  providerMessageId: string | null;
  createdAt: Date;
  deliveredAt: Date | null;
};

export class EmailEntity extends Entity<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  static create(props: EmailProps): EmailEntity {
    return new EmailEntity(props);
  }

  get emailId(): EmailId {
    return this.props.id;
  }

  get sender(): string {
    return this.props.sender;
  }

  get recipient(): string {
    return this.props.recipient;
  }

  get subject(): string {
    return this.props.subject;
  }

  get body(): string {
    return this.props.body;
  }

  get status(): EmailStatus {
    return this.props.status;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get nextAttemptAt(): Date {
    return this.props.nextAttemptAt;
  }

  get processingStartedAt(): Date | null {
    return this.props.processingStartedAt;
  }

  get lastError(): string | null {
    return this.props.lastError;
  }

  get providerMessageId(): string | null {
    return this.props.providerMessageId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get deliveredAt(): Date | null {
    return this.props.deliveredAt;
  }

  isDelivered(): boolean {
    return this.status.isCompleted();
  }

  isPending(): boolean {
    return this.status.isPending();
  }

  isFailed(): boolean {
    return this.status.isFailed();
  }
}
