import { ValueObject } from "src/shared/domain/value-object/value-object";

 export enum EmailStatusType {
    COMPLETED = 'completed',
    PENDING = 'pending',
    PROCESSING = 'processing',
    FAILED = 'failed'
  }

  type EmailStatusProps = {
    status: EmailStatusType;
  };

  export class EmailStatus extends ValueObject<EmailStatusProps> {
    private constructor(status: EmailStatusType) {
      super({ status });
    }

    static pending(): EmailStatus {
      return new EmailStatus(EmailStatusType.PENDING);
    }

    static completed(): EmailStatus {
      return new EmailStatus(EmailStatusType.COMPLETED);
    }

    static processing(): EmailStatus {
      return new EmailStatus(EmailStatusType.PROCESSING);
    }

    static failed(): EmailStatus {
      return new EmailStatus(EmailStatusType.FAILED);
    }

    static from(status: EmailStatusType): EmailStatus {
      return new EmailStatus(status);
    }

    get status(): EmailStatusType {
      return this.props.status;
    }


    isPending(): boolean {
      return this.status === EmailStatusType.PENDING;
    }

    isCompleted(): boolean {
      return this.status === EmailStatusType.COMPLETED;
    }

    isProcessing(): boolean {
      return this.status === EmailStatusType.PROCESSING;
    }

    isFailed(): boolean {
      return this.status === EmailStatusType.FAILED;
    }
  }
