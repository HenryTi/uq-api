import {
    PBizBudID, PBizBudChar, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudIntOf, PBizBudNone, PBizBudPickable, PBizBudRadio, PContext, PElement, PBizBudIDBase
} from "../../parser";
import { IElement } from "../IElement";
import { BizBase } from "./Base";
import { BizAtom, BizID, BizIDExtendable, BizSpec } from "./BizID";
import { BizOptions, OptionsItemValueType } from "./Options";
import { BizEntity, BudIndex } from "./Entity";
import { ValueExpression } from "../Exp";
import { Biz } from "./Biz";
import { UI } from "../UI";
import { BizBin } from "./Bin";
import { BizPhraseType, BudDataType } from "./BizPhraseType";

export enum BudValueSetType {
    equ = 1,            // 设置不可修改. 这是默认
    init = 2,           // 只提供初值，可修改
    show = 3,           // 只显示，不保存
}

export abstract class FieldShowItem<T extends BizEntity = BizEntity> {
    readonly bizEntity: T;
    readonly bizBud: BizBud;
    constructor(bizEntity: T, bizBud: BizBud) {
        this.bizEntity = bizEntity;
        this.bizBud = bizBud;
    }
    static createEntityFieldShow(entity: BizEntity, bizBud: BizBud) {
        return new EntityFieldShowItem(entity, bizBud);
    }
    static createBinFieldShow(bizBin: BizBin, bizBud: BizBud) {
        return new BinFieldShowItem(bizBin, bizBud);
    }
    static createSpecFieldShow(bizSpec: BizSpec, bizBud: BizBud) {
        return new SpecFieldShowItem(bizSpec, bizBud);
    }
    static createSpecAtomFieldShow(bizSpec: BizSpec, bizBud: BizBud) {
        return new SpecAtomFieldShowItem(bizSpec, bizBud);
    }
    static createAtomFieldShow(bizAtom: BizAtom, bizBud: BizBud) {
        return new AtomFieldShowItem(bizAtom, bizBud);
    }
}
class EntityFieldShowItem extends FieldShowItem<BizEntity> {
}
class BinFieldShowItem extends FieldShowItem<BizBin> {
}
class SpecFieldShowItem extends FieldShowItem<BizSpec> {
}
class SpecAtomFieldShowItem extends FieldShowItem<BizSpec> {
}
class AtomFieldShowItem extends FieldShowItem<BizAtom> {
}

export interface FieldShow {
    owner: BizBud;
    items: FieldShowItem[];
}

export interface BudValue {
    exp: ValueExpression;
    str?: string;           // 传到前台的schema: init, equ, show
}

export interface BudValueSet extends BudValue {
    setType: BudValueSetType;
}

export class BudGroup extends BizBase {
    readonly bizPhraseType = BizPhraseType.budGroup;
    readonly buds: BizBud[] = [];

    constructor(biz: Biz, name: string) {
        super(biz);
        this.name = name;
    }
    parser(context: PContext): PElement<IElement> {
        return;
    }
    buildSchema(res: { [phrase: string]: string }): any {
        let ret = super.buildSchema(res);
        if (this.buds.length > 0) {
            ret.buds = this.buds.map(v => v.id);
        }
        return ret;
    }
}

export abstract class BizBud extends BizBase {
    readonly bizPhraseType = BizPhraseType.bud;
    abstract get dataType(): BudDataType;
    get objName(): string { return undefined; }
    flag: BudIndex = BudIndex.none;
    getFieldShows(): FieldShow[] { return undefined }
    // show: boolean;      // 仅用于显示
    constructor(biz: Biz, name: string, ui: Partial<UI>) {
        super(biz);
        this.name = name;
        this.ui = ui;
    }
    // buildBudValue(callback: (value: BudValueSet) => void) { }
    buildBudValue(expStringify: (value: ValueExpression) => string) { }
}

export enum SetType {
    assign,
    balance,
    cumulate,
}

export abstract class BizBudValue extends BizBud {
    abstract get canIndex(): boolean;
    value: BudValueSet;
    hasHistory: boolean;
    setType: SetType;
    required: boolean;
    get optionsItemType(): OptionsItemValueType { return; }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            dataType: this.dataType,
            value: this.value?.str,
            history: this.hasHistory === true ? true : undefined,
            setType: this.setType ?? SetType.assign,
            // show: this.show,
        }
    }
    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        if (this.name === 'item') debugger;
        super.buildPhrases(phrases, prefix);
    }
    buildBudValue(expStringify: (value: ValueExpression) => string) {
        if (this.value === undefined) return;
        let { exp, setType } = this.value;
        let str = expStringify(exp);
        let typeStr = BudValueSetType[setType];
        str += '\n' + typeStr;
        this.value.str = str;
    }
    /*
    buildBudValue(callback: (value: BudValueSet) => void) {
        callback(this.value);
    }
    */
}

export class BizBudPickable extends BizBudValue {
    readonly dataType = BudDataType.atom;
    readonly canIndex = false;
    pick: string;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudPickable(this, context);
    }
    buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        ret.pick = this.pick;
        return ret;
    }
}

export class BizBudNone extends BizBudValue {
    readonly dataType = BudDataType.none;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudNone(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export abstract class BizBudValueWithRange extends BizBudValue {
    min: BudValue;
    max: BudValue;
    override buildSchema(res: { [phrase: string]: string; }) {
        let ret = super.buildSchema(res);
        if (this.min !== undefined) {
            ret.min = this.min.str;
        }
        if (this.max !== undefined) {
            ret.max = this.max.str;
        }
        return ret;
    }
    override buildBudValue(expStringify: (value: ValueExpression) => string): void {
        super.buildBudValue(expStringify);
        if (this.min !== undefined) {
            this.min.str = expStringify(this.min.exp);
        }
        if (this.max !== undefined) {
            this.max.str = expStringify(this.max.exp);
        }
    }
}

export class BizBudInt extends BizBudValueWithRange {
    readonly dataType = BudDataType.int;
    readonly canIndex = true;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudInt(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudDec extends BizBudValueWithRange {
    readonly dataType = BudDataType.dec;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDec(this, context);
    }
}

export class BizBudChar extends BizBudValueWithRange {
    readonly dataType = BudDataType.char;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudChar(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudDate extends BizBudValueWithRange {
    readonly dataType = BudDataType.date;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDate(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudIDBase extends BizBud {
    readonly dataType = BudDataType.atom;
    // readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudIDBase(this, context);
    }
}

export class BizBudID extends BizBudValue {
    readonly dataType = BudDataType.atom;
    readonly canIndex = true;
    ID: BizID;
    fieldShows: FieldShow[];
    getFieldShows(): FieldShow[] { return this.fieldShows; }
    readonly params: { [param: string]: BudValueSet; } = {};        // 仅仅针对Spec，可能有多级的base
    parser(context: PContext): PElement<IElement> {
        return new PBizBudID(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        ret.atom = this.ID?.name;
        let hasParams: boolean = false;
        let params = {} as any;
        for (let i in this.params) {
            params[i] = this.params[i].str;
            hasParams = true;
        }
        if (hasParams === true) ret.params = params;
        return ret;
    }
    get objName(): string { return this.ID?.phrase; }
    buildBudValue(expStringify: (value: ValueExpression) => string) {
        super.buildBudValue(expStringify);
        for (let i in this.params) {
            let param = this.params[i];
            let { exp } = param;
            param.str = expStringify(exp);
        }
    }
    /*
    buildBudValue(callback: (value: BudValueSet) => void) {
        super.buildBudValue(callback);
        for (let i in this.params) {
            callback(this.params[i]);
        }
    }
    */
}

export abstract class BizBudOptions extends BizBudValue {
    // readonly items: BizSubItem[] = [];
    options: BizOptions;
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret, options: this.options?.phrase
        };
    }
    get objName(): string { return this.options?.phrase; }
}

export class BizBudIntOf extends BizBudOptions {
    readonly dataType = BudDataType.intof;
    readonly canIndex = true;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudIntOf(this, context);
    }
}

export class BizBudRadio extends BizBudOptions {
    readonly dataType = BudDataType.radio;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudRadio(this, context);
    }
}

export class BizBudCheck extends BizBudOptions {
    readonly dataType = BudDataType.check;
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCheck(this, context);
    }
}
