import { /*PBizPermit, PBizPermitItem, */PBizRole, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizNotID } from "./Entity";

export class BizRole extends BizNotID {
    readonly bizPhraseType = BizPhraseType.permit; //.role;
    readonly roles = new Map<string, BizRole>();
    get type(): string { return 'permit'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizRole(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }
}
