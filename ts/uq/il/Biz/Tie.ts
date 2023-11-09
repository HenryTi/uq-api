import { BBizEntity, BBizTie, DbContext } from "../../builder";
import { PBizTie, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizAtomID } from "./Atom";
import { BizPhraseType } from "./Base";
import { BizEntity } from "./Entity";

export interface TieField {
    caption: string;
    atoms: BizAtomID[];         // atoms === undefined 则 ME
}

export class BizTie extends BizEntity {
    readonly bizPhraseType = BizPhraseType.tie;
    protected fields = ['i', 'x'];
    readonly i = {} as TieField;
    readonly x = {} as TieField;

    parser(context: PContext): PElement<IElement> {
        return new PBizTie(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.i = this.tieFieldSchema(this.i);
        ret.x = this.tieFieldSchema(this.x);
        return ret;
    }

    private tieFieldSchema(tieField: TieField) {
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
