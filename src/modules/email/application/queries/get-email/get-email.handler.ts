import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EMAIL_REPOSITORY } from '../../port/repositories/email.repository.port';
import type { EmailRepository } from '../../port/repositories/email.repository.port';
import { EmailEntity } from '../../../domain/entity/email.entity';
import { GetEmailQuery } from './get-email.query';

@QueryHandler(GetEmailQuery)
export class GetEmailHandler
  implements IQueryHandler<GetEmailQuery>
{
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly emailRepository: EmailRepository,
  ) {}

  execute(query: GetEmailQuery): Promise<EmailEntity | null> {
    return this.emailRepository.findById(query.queryId);
  }
}
