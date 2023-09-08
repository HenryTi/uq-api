import { PBizMoniker, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizMoniker extends BizEntity {
    readonly type = 'moniker';

    parser(context: PContext): PElement<IElement> {
        return new PBizMoniker(this, context);
    }

    buildSchema() {
        let ret = super.buildSchema();
        return { ...ret, };
    }
}
