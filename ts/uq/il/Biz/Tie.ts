import { PBizTie, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizTie extends BizEntity {
    readonly type = 'tie';

    parser(context: PContext): PElement<IElement> {
        return new PBizTie(this, context);
    }

    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}
