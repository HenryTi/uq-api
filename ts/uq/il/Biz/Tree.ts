import { PBizTree, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";

export class BizTree extends BizEntity {
    readonly bizPhraseType = BizPhraseType.tree;
    readonly isID = false;
    protected fields = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizTree(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
