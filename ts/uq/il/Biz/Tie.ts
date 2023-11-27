import { BBizEntity, BBizTie, DbContext } from "../../builder";
import { PBizTie, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { IxField } from "./Base";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";

export class BizTie extends BizEntity {
    readonly bizPhraseType = BizPhraseType.tie;
    protected fields = ['i', 'x'];
    readonly i = {} as IxField;
    readonly x = {} as IxField;

    parser(context: PContext): PElement<IElement> {
        return new PBizTie(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.i = this.ixFieldSchema(this.i);
        ret.x = this.ixFieldSchema(this.x);
        return ret;
    }

    db(dbContext: DbContext): BBizEntity {
        return new BBizTie(dbContext, this);
    }
}
