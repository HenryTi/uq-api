import { BBizAtom, BBizSpec, DbContext } from "../../builder";
import { PBizAtom, /*PBizAtomBud, */PBizSpec, PBizDuo, PContext, PElement, PIDUnique } from "../../parser";
import { IElement } from "../IElement";
import { UI } from "../UI";
import { IxField } from "./Base";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

// 任何可以独立存在，可被引用ID
// 扩展和继承：有两个方式，一个是typescript里面的extends，一个是spec的base
// 按照这个原则，BizBin应该也是BizID。当前不处理。以后可以处理
// BizBin是一次操作行为记录，跟普通的BizID区别明显。作为ID仅用于引用。
export abstract class BizID extends BizEntity {
    titleBuds: BizBud[];
    primeBuds: BizBud[];
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        if (this.titleBuds !== undefined) {
            ret[':&'] = this.titleBuds.map(v => v.id);
        }
        if (this.primeBuds !== undefined) {
            ret[':'] = this.primeBuds.map(v => v.id);
        }
        return ret;
    }
}

export abstract class BizIDExtendable extends BizID {
    extends: BizIDExtendable;
    uniques: IDUnique[];

    get extendsPhrase(): string { return this.extends === undefined ? '' : this.extends.phrase; }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            extends: this.extends?.id,
            uniques: this.uniques?.map(v => v.name),
        });
    }
    getBud(name: string): BizBud {
        let ret = super.getBud(name);
        if (ret !== undefined) return ret;
        for (let p: BizIDExtendable = this.extends; p !== undefined; p = p.extends) {
            ret = p.getBud(name);
            if (ret !== undefined) return ret;
        }
    }
    getUnique(name: string): IDUnique {
        let u = this.uniques?.find(v => v.name === name);
        if (u !== undefined) return u;
        return this.extends?.getUnique(name);
    }
    getUniques(): IDUnique[] {
        let us = [...(this.uniques ?? [])];
        if (this.extends === undefined) return us;
        us.push(...this.extends.getUniques());
        return us;
    }
    forEachBud(callback: (bud: BizBud) => void): void {
        super.forEachBud(callback);
        if (this.uniques !== undefined) {
            for (let unique of this.uniques) {
                callback(unique);
            }
        }
    }
}

export class IDUnique extends BizBud {
    readonly dataType = BudDataType.unique;
    readonly bizAtom: BizIDExtendable;
    keys: BizBud[];
    no: BizBud;
    IDOwner: BizIDExtendable;

    constructor(bizAtom: BizIDExtendable, name: string, ui: Partial<UI>) {
        super(bizAtom, name, ui);
        this.bizAtom = bizAtom;
    }

    override parser(context: PContext): PElement<IElement> {
        return new PIDUnique(this, context);
    }
}

export class BizAtom extends BizIDExtendable {
    readonly bizPhraseType = BizPhraseType.atom;
    ex: BizBudValue;
    uuid: boolean;
    protected readonly fields = ['id', 'no', 'ex'];

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    db(dbContext: DbContext): BBizAtom {
        return new BBizAtom(dbContext, this);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            uuid: this.uuid,
            ex: this.ex?.buildSchema(res),
        });
    }
}

// 分子：atom 原子的合成
// duo: 二重奏
export class BizDuo extends BizID {
    readonly bizPhraseType = BizPhraseType.duo;
    readonly i = {} as IxField;
    readonly x = {} as IxField;

    parser(context: PContext): PElement<IElement> {
        return new PBizDuo(this, context);
    }
    protected readonly fields = ['id', 'i', 'x'];

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.i = this.ixFieldSchema(this.i);
        ret.x = this.ixFieldSchema(this.x);
        return ret;
    }
}

export abstract class BizIDWithBase extends BizIDExtendable {
    base: BizIDWithBase;    // only base, not base atom, then bizAtomFlag
    isIxBase: boolean;          // 如果true，不能临时录入，只能选择。

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.name,
            ix: this.isIxBase,
        });
    }
}

export class BizSpec extends BizIDWithBase {
    readonly bizPhraseType = BizPhraseType.spec;
    protected readonly fields = ['id'];
    keys: BizBud[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizSpec(this, context);
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

    override forEachBud(callback: (bud: BizBud) => void) {
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

export class BizIDAny extends BizID {
    static current: BizIDAny = new BizIDAny(undefined);
    readonly bizPhraseType = BizPhraseType.any;
    protected readonly fields = ['id'];
    name = '*';
    parser(context: PContext): PElement<IElement> { return undefined; }

}
