import { PBizPrint, PBizTemplet, PContext, PElement } from "../../parser";
import { BizPhraseType } from "./BizPhraseType";
import { BizNotID } from "./Entity";

export class BizTemplet extends BizNotID {
    readonly bizPhraseType = BizPhraseType.templet;
    template: string;

    parser(context: PContext): PElement {
        return new PBizTemplet(this, context);
    }

}

export class BizPrint extends BizNotID {
    readonly bizPhraseType = BizPhraseType.print;

    parser(context: PContext): PElement {
        return new PBizPrint(this, context);
    }
}
