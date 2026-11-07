import { ValueObject } from "src/shared/domain/value-object/value-object";


type EmailIdProps = {
    value: string;
  };

export class EmailId extends ValueObject<EmailIdProps> {
    private constructor(value: string) {
      super({ value });
    }

    static create(value: string): EmailId {
      if (!value) {
        throw new Error('Email ID is required');
      }

      return new EmailId(value);
    }

    get value(): string {
      return this.props.value;
    }
  }