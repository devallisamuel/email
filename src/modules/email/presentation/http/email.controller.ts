import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateBulkEmailsCommand } from '../../application/commands/create-bulk-emails/create-bulk-emails.command';
import { CreateEmailCommand } from '../../application/commands/create-email/create-email.command';
import { CreateBulkEmailsDto } from './dto/create-bulk-emails.dto';
import { CreateEmailDto } from './dto/create-email.dto';
import { EmailResponseDto } from './dto/email-response.dto';

@ApiTags('emails')
@Controller('emails')
export class EmailController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an email for delivery' })
  @ApiCreatedResponse({
    description: 'The email was created with a pending delivery status.',
    type: EmailResponseDto,
  })
  async create(@Body() dto: CreateEmailDto): Promise<EmailResponseDto> {
    const email = await this.commandBus.execute(
      new CreateEmailCommand(dto.recipient, dto.subject, dto.body),
    );

    return EmailResponseDto.fromDomain(email);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create up to 100 emails for delivery' })
  @ApiCreatedResponse({
    description: 'The emails were created with pending delivery statuses.',
    type: EmailResponseDto,
    isArray: true,
  })
  async createBulk(
    @Body() dto: CreateBulkEmailsDto,
  ): Promise<EmailResponseDto[]> {
    const emails = await this.commandBus.execute(
      new CreateBulkEmailsCommand(dto.emails),
    );

    return emails.map((email) => EmailResponseDto.fromDomain(email));
  }
}
