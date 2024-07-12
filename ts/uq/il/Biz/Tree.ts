import { PBizTree, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizPhraseType } from "./BizPhraseType";
import { BizNotID } from "./Entity";

export class BizTree extends BizNotID {
    readonly bizPhraseType = BizPhraseType.tree;
    protected fields = [];
    parser(context: PContext): PElement<IElement> {
        return new PBizTree(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
