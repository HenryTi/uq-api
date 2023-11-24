import { BBizSpec, DbContext } from "../../builder";
import { PBizAtom, /*PBizAtomBud, */PBizAtomSpec, PBizDuo, PContext, PElement } from "../../parser";
import { IElement } from "../IElement";
import { IxField } from "./Base";
import { BizPhraseType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

export abstract class BizAtomID extends BizEntity {
    extends: BizAtomID;

    get basePhrase(): string { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, { extends: this.extends?.id });
    }
    getBud(name: string): BizBud {
        let ret = super.getBud(name);
        if (ret !== undefined) return ret;
        for (let p: BizAtomID = this.extends; p !== undefined; p = p.extends) {
            ret = p.getBud(name);
            if (ret !== undefined) return ret;
        }
    }
}

export class BizAtom extends BizAtomID {
    readonly bizPhraseType = BizPhraseType.atom;
    ex: BizBudValue;
    uuid: boolean;
    protected readonly fields = ['id', 'no', 'ex'];

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            uuid: this.uuid,
            // uom: this.uom,
            ex: this.ex?.buildSchema(res),
        });
    }
}

// 分子：atom 原子的合成
export class BizDuo extends BizAtomID {
    readonly bizPhraseType = BizPhraseType.duo;
    readonly i = {} as IxField;
    readonly x = {} as IxField;

    parser(context: PContext): PElement<IElement> {
        return new PBizDuo(this, context);
    }
    protected readonly fields = ['id', 'i', 'x'];
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
    protected readonly fields = ['id'];
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
        return this.base.getBud(name);
    }

    db(dbContext: DbContext): BBizSpec {
        return new BBizSpec(dbContext, this);
    }
}

export class BizAtomIDAny extends BizAtomID {
    static current: BizAtomIDAny = new BizAtomIDAny(undefined);
    readonly bizPhraseType = BizPhraseType.any;
    protected readonly fields = ['id'];
    name = '*';
    parser(context: PContext): PElement<IElement> { return undefined; }

}
