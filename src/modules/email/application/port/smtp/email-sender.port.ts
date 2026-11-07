import { EmailEntity } from "src/modules/email/domain/entity/email.entity";


  export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

  export interface EmailSender {
    send(email: EmailEntity): Promise<string>;
  }