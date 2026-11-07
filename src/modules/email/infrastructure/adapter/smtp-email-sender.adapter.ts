import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import nodemailer, { Transporter } from 'nodemailer';
  import { EmailEntity } from '../../domain/entity/email.entity';
import { EmailSender } from '../../application/port/smtp/email-sender.port';

  @Injectable()
  export class SmtpEmailSenderAdapter implements EmailSender {
    private transporter?: Transporter;

    constructor(private readonly configService: ConfigService) {}

    async send(email: EmailEntity): Promise<string> {
      const result = await this.getTransporter().sendMail({
        from: this.configService.getOrThrow<string>('EMAIL_FROM'),
        to: email.recipient,
        subject: email.subject,
        text: email.body,

        headers: {
          'X-Idempotency-Key': email.id,
        },
      });

      return result.messageId;
    }

    private getTransporter(): Transporter {
      if (this.transporter) {
        return this.transporter;
      }

      const user = this.configService.get<string>('EMAIL_SMTP_USER');

      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('EMAIL_SMTP_HOST'),
        port: Number(
          this.configService.getOrThrow<string>('EMAIL_SMTP_PORT'),
        ),
        secure:
          this.configService.getOrThrow<string>('EMAIL_SMTP_SECURE') === 'true',

        auth: user
          ? {
              user,
              pass: this.configService.getOrThrow<string>(
                'EMAIL_SMTP_PASSWORD',
              ),
            }
          : undefined,
      });

      return this.transporter;
    }
}
