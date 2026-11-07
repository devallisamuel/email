export type CreateEmailInput = {
  recipient: string;
  subject: string;
  body: string;
};

export class CreateBulkEmailsCommand {
  constructor(public readonly emails: CreateEmailInput[]) {}
}
