import { PBizPick, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizAtom, BizAtomSpec } from "./Atom";
import { BizPhraseType } from "./Base";
import { BizEntity } from "./Entity";

export class BizPick extends BizEntity {
    readonly bizPhraseType = BizPhraseType.pick;
    readonly atoms: BizAtom[] = [];
    specs: BizAtomSpec[] = [];

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
}
