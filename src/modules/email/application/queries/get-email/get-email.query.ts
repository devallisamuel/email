import { EmailId } from "src/modules/email/domain/value-object/email-id.vo";

export class GetEmailQuery {
    constructor(public readonly queryId: EmailId) {

    }
}