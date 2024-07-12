import { PBizTitle, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizNotID } from "./Entity";

export class BizTitle extends BizNotID {
    readonly bizPhraseType = BizPhraseType.book;
    protected readonly fields = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizTitle(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
