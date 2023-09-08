import { PBizTree, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizTree extends BizEntity {
    readonly type = 'tree';
    parser(context: PContext): PElement<IElement> {
        return new PBizTree(this, context);
    }

    buildSchema() {
        let ret = super.buildSchema();
        return { ...ret, };
    }
}
