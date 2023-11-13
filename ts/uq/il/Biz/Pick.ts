import { BBizPick, DbContext } from "../../builder";
import { PBizPick, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizPhraseType } from "./BizPhraseType";
import { BizEntity } from "./Entity";
import { BizQueryTable } from "./Query";

export class BizPick extends BizEntity {
    readonly bizPhraseType = BizPhraseType.pick;
    protected readonly fields = [];
    readonly atoms: BizAtom[] = [];
    specs: BizAtomSpec[] = [];
    query: BizQueryTable;

    parser(context: PContext): PElement<IElement> {
        return new PBizPick(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            atoms: this.atoms.map(v => v.name),
            specs: this.specs.map(v => v.name),
        });
    }

    db(dbContext: DbContext): BBizPick {
        return new BBizPick(dbContext, this);
    }
}
