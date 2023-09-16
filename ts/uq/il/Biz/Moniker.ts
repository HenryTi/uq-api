import { PBizMoniker, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export class BizMoniker extends BizEntity {
    readonly type = 'moniker';

    parser(context: PContext): PElement<IElement> {
        return new PBizMoniker(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, };
    }
}
