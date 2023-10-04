import { BBizSpec, DbContext } from "../../builder";
import { PBizAtom, /*PBizAtomBud, */PBizAtomSpec, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizPhraseType } from "./Base";
import { BizBudValue } from "./Bud";
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
    ex: BizBudValue;
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
}

export abstract class BizAtomIDWithBase extends BizAtomID {
    base: BizAtomIDWithBase;              // only base, not base atom, then bizAtomFlag
    isIxBase: boolean;

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
            ix: this.isIxBase,
        });
    }
}

export class BizAtomSpec extends BizAtomIDWithBase {
    readonly bizPhraseType = BizPhraseType.spec;
    keys: BizBudValue[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizAtomSpec(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        return Object.assign(ret, {
            keys,
        });
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let key of this.keys) {
            key.buildPhrases(phrases, phrase)
        }
    }

    override forEachBud(callback: (bud: BizBudValue) => void) {
        super.forEachBud(callback);
        for (let key of this.keys) callback(key);
    }

    override getBud(name: string) {
        let bud = super.getBud(name);
        if (bud !== undefined) return bud;
        for (let kBud of this.keys) {
            if (kBud.name === name) return kBud;
        }
        return undefined;
    }

    db(dbContext: DbContext): BBizSpec {
        return new BBizSpec(dbContext, this);
    }
}

export class BizAtomIDAny extends BizAtomID {
    static current: BizAtomIDAny = new BizAtomIDAny(undefined);
    readonly bizPhraseType = BizPhraseType.any;
    name = '*';
    parser(context: PContext): PElement<IElement> { return undefined; }

}
