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
        ret.i = this.tieFieldSchema(this.i);
        ret.x = this.tieFieldSchema(this.x);
        return ret;
    }

    private tieFieldSchema(tieField: IxField) {
        const { caption, atoms } = tieField;
        let ret = {
            caption,
            atoms: atoms?.map(v => v.id),
        }
        return ret;
    }

    db(dbContext: DbContext): BBizEntity {
        return new BBizTie(dbContext, this);
    }
}
