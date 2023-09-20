import { BBizAtom, DbContext } from "../../builder";
import { PBizAtom, PBizAtomBud, PBizAtomSpec, PBizPick, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizBud } from "./Bud";
import { BizEntity } from "./Entity";

export abstract class BizAtomID extends BizEntity {
    extends: BizAtomID;

    get basePhrase(): string { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, { extends: this.extends?.name });
    }
}

export class BizAtom extends BizAtomID {
    readonly bizPhraseType = BizPhraseType.atom;
    ex: BizBud;
    uom: boolean;
    uuid: boolean;

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            uuid: this.uuid,
            uom: this.uom,
            ex: this.ex?.buildSchema(res),
        });
    }

    db(dbContext: DbContext): BBizAtom {
        return new BBizAtom(dbContext, this);
    }
}

export abstract class BizAtomIDWithBase extends BizAtomID {
    base: BizAtomIDWithBase;              // only base, not base atom, then bizAtomFlag

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
        });
    }
}

export class BizAtomSpec extends BizAtomIDWithBase {
    readonly bizPhraseType = BizPhraseType.spec;
    keys: BizBud[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizAtomSpec(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            keys: this.keys?.map(v => v.buildSchema(res)),
        });
    }
}

export class BizAtomBud extends BizAtomIDWithBase {
    readonly bizPhraseType = BizPhraseType.bud;
    join: BizAtomID;              // only join, not join atom, then bizAtomFlag

    parser(context: PContext): PElement<IElement> {
        return new PBizAtomBud(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            join: this.join.name,
        });
    }
}

export class BizAtomIDAny extends BizAtomID {
    static current: BizAtomIDAny = new BizAtomIDAny(undefined);
    readonly bizPhraseType = BizPhraseType.any;
    name = '*';
    parser(context: PContext): PElement<IElement> { return undefined; }

}

export class BizPick extends BizEntity {
    readonly bizPhraseType = BizPhraseType.pick;
    readonly atoms: BizAtom[] = [];
    uom: boolean;
    spec: BizAtomSpec;
    readonly joins: BizAtomID[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizPick(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            atoms: this.atoms.map(v => v.name),
            uom: this.uom,
            spec: this.spec?.name,
            joins: this.joins.map(v => v.name),
        });
    }
}
