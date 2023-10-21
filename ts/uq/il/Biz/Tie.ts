import { PBizTie, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizEntity } from "./Entity";

export class BizTie extends BizEntity {
    readonly bizPhraseType = BizPhraseType.tie;
    protected fields = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizTie(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
