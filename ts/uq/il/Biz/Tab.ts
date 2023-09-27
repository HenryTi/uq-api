import { PBizTab, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizEntity } from "./Entity";

export class BizTab extends BizEntity {
    readonly bizPhraseType = BizPhraseType.tab;

    parser(context: PContext): PElement<IElement> {
        return new PBizTab(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
