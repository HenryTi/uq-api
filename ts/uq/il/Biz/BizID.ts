import { BBizAtom, BBizCombo, BBizFork, DbContext } from "../../builder";
import { PBizAtom, /*PBizAtomBud, */PBizFork as PBizFork, PContext, PElement, PIDUnique, PBizCombo } from "../../parser";
import { IElement } from "../IElement";
import { UI } from "../UI";
import { BizPhraseType, BudDataType } from "./BizPhraseType";
import { BizBud, BizBudValue } from "./Bud";
import { BizEntity, BizID } from "./Entity";

// 任何可以独立存在，可被引用ID
// 扩展和继承：有两个方式，一个是typescript里面的extends，一个是spec的base
// 按照这个原则，BizBin应该也是BizID。当前不处理。以后可以处理
// BizBin是一次操作行为记录，跟普通的BizID区别明显。作为ID仅用于引用。
export abstract class BizIDWithShowBuds extends BizID {
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

    getTitlePrimeBuds() {
        let ret: BizBud[] = [];
        let { titleBuds, primeBuds } = this;
        if (titleBuds !== undefined) ret.push(...titleBuds);
        if (primeBuds !== undefined) ret.push(...primeBuds);
        return ret;
    }
}

export abstract class BizIDExtendable extends BizIDWithShowBuds {
    extends: BizIDExtendable;
    extendeds: BizIDExtendable[];
    uniques: IDUnique[];
    readonly main = undefined;

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

    override getTitlePrimeBuds() {
        let ret: BizBud[] = [];
        for (let p: BizIDExtendable = this; p !== undefined; p = p.extends) {
            let { titleBuds, primeBuds } = p;
            if (titleBuds !== undefined) ret.push(...titleBuds);
            if (primeBuds !== undefined) ret.push(...primeBuds);
        }
        return ret;
    }

    decendants(set: Set<BizEntity>) {
        super.decendants(set);
        if (this.extendeds !== undefined) {
            for (let e of this.extendeds) e.decendants(set);
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
    clone(entity: BizEntity, name: string, ui: Partial<UI>) {
        return new IDUnique(this.bizAtom, name, ui);
    }
    override parser(context: PContext): PElement<IElement> {
        return new PIDUnique(this, context);
    }
}

export class BizAtom extends BizIDExtendable {
    static ownFields = ['id', 'no', 'ex'];
    readonly bizPhraseType = BizPhraseType.atom;
    ex: BizBudValue;
    uuid: boolean;
    protected readonly fields = BizAtom.ownFields;

    parser(context: PContext): PElement<IElement> {
        return new PBizAtom(this, context);
    }

    db(dbContext: DbContext): BBizAtom {
        return new BBizAtom(dbContext, this);
    }
}

export abstract class BizIDWithBase extends BizIDExtendable {
    fork: BizIDWithBase;
    base: BizIDWithBase;    // only base, not base atom, then bizAtomFlag
    preset: boolean;          // 如果true，不能临时录入，只能选择。

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return Object.assign(ret, {
            base: this.base.id,
            preset: this.preset,
        });
    }
}

export class BizFork extends BizIDWithBase {
    readonly bizPhraseType = BizPhraseType.fork;
    protected readonly fields = ['id'];
    readonly keys: BizBud[] = [];

    parser(context: PContext): PElement<IElement> {
        return new PBizFork(this, context);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        ret.keys = keys;
        return ret;
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

    db(dbContext: DbContext): BBizFork {
        return new BBizFork(dbContext, this);
    }
}

export class BizCombo extends BizIDWithShowBuds {
    protected readonly fields = ['id'];
    readonly bizPhraseType = BizPhraseType.combo;
    readonly keys: BizBud[] = [];
    readonly indexes: BizBud[][] = [];
    readonly main = undefined;

    parser(context: PContext): PElement<IElement> {
        return new PBizCombo(this, context);
    }

    db(dbContext: DbContext): BBizCombo {
        return new BBizCombo(dbContext, this);
    }

    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        let keys = this.keys.map(v => {
            return v.buildSchema(res);
        });
        ret.keys = keys;
        return ret;
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
        return;
    }
}

export class BizIDAny extends BizIDWithShowBuds {
    static current: BizIDAny = new BizIDAny(undefined);
    readonly bizPhraseType = BizPhraseType.any;
    protected readonly fields = ['id'];
    readonly main = undefined;
    name = '*';
    parser(context: PContext): PElement<IElement> { return undefined; }

}
