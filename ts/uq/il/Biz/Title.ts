import { PBizTitle, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizEntity } from "./Entity";

export class BizTitle extends BizEntity {
    readonly bizPhraseType = BizPhraseType.title;

    parser(context: PContext): PElement<IElement> {
        return new PBizTitle(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
