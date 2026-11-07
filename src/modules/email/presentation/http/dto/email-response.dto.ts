import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailEntity } from '../../../domain/entity/email.entity';
import { EmailStatusType } from '../../../domain/value-object/email-status.vo';

export class EmailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'sender@example.com' })
  sender!: string;

  @ApiProperty({ example: 'recipient@example.com' })
  recipient!: string;

  @ApiProperty({ example: 'New email' })
  subject!: string;

  @ApiProperty({ example: 'Welcome to the service.' })
  body!: string;

  @ApiProperty({ enum: EmailStatusType, example: EmailStatusType.PENDING })
  status!: EmailStatusType;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  deliveredAt!: Date | null;

  static fromDomain(email: EmailEntity): EmailResponseDto {
    return {
      id: email.id,
      sender: email.sender,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status.status,
      createdAt: email.createdAt,
      deliveredAt: email.deliveredAt,
    };
  }
}
