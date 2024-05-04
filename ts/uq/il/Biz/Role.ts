import { /*PBizPermit, PBizPermitItem, */PBizRole, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";

export class BizRole extends BizEntity {
    readonly bizPhraseType = BizPhraseType.permit; //.role;
    protected readonly fields = [];
    readonly roles = new Map<string, BizRole>();
    get type(): string { return 'permit'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizRole(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }
}
