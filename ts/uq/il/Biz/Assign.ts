import { BBizAssign, BBizEntity, DbContext } from "../../builder";
import { PContext, PElement } from "../../parser";
import { PBizAssign } from "../../parser/Biz/Assign";
import { IElement } from "../IElement";
import { BizAtom } from "./BizID";
import { BizPhraseType } from "./BizPhraseType";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export class BizAssign extends BizEntity {
    readonly bizPhraseType = BizPhraseType.assign;
    readonly isID = false;
    protected readonly fields = [];
    readonly atom: BizAtom[] = [];
    readonly title: [BizEntity, BizBud][] = [];       // of BizTitle buds

    parser(context: PContext): PElement<IElement> {
        return new PBizAssign(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.map(v => v.name);
        ret.title = this.title.map(([entity, bud]) => ([entity.id, bud.id]));
        return ret;
    }

    db(dbContext: DbContext): BBizEntity {
        return new BBizAssign(dbContext, this);
    }
}
