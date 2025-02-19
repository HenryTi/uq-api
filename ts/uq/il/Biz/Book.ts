import { PBizBook, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizID, BizNotID } from "./Entity";

export class BizBook extends BizNotID {
    readonly bizPhraseType = BizPhraseType.book;
    i: BizID;

    parser(context: PContext): PElement<IElement> {
        return new PBizBook(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.i !== undefined) {
            ret.i = this.i.id;
        }
        return ret;
    }
}
