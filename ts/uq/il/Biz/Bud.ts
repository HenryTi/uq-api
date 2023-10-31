import {
    PBizBudAtom, PBizBudChar, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudIntOf, PBizBudNone, PBizBudPickable, PBizBudRadio, PContext, PElement
} from "../../parser";
import { IElement } from "../element";
import { BizBase, BizPhraseType, BudDataType } from "./Base";
import { BizAtom, BizAtomID } from "./Atom";
import { BizOptions, OptionsItemValueType } from "./Options";
import { BudIndex } from "./Entity";
import { ValueExpression } from "../Exp";
import { Biz } from "./Biz";
import { BizQueryValue } from "./Query";

export enum BudValueAct {
    equ = 1,            // 设置不可修改. 这是默认
    init = 2,           // 只提供初值，可修改
}

export interface BudValue {
    exp: ValueExpression;
    act: BudValueAct;
    query: BizQueryValue;
    str?: string;
}

export abstract class BizBud extends BizBase {
    readonly bizPhraseType = BizPhraseType.any;
    abstract get dataType(): BudDataType;
    get objName(): string { return undefined; }
    flag: BudIndex = BudIndex.none;
    get ex(): object { return undefined }
    constructor(biz: Biz, name: string, caption: string) {
        super(biz);
        this.name = name;
        this.caption = caption;
    }
}

export enum SetType {
    assign,
    balance,
    cumulate,
}

export abstract class BizBudValue extends BizBud {
    abstract get canIndex(): boolean;
    value: BudValue;
    hasHistory: boolean;
    format: string;
    setType: SetType;
    get optionsItemType(): OptionsItemValueType { return; }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            dataType: this.dataType,
            value: this.value?.str,
            ex: this.ex,
            history: this.hasHistory === true ? true : undefined,
            setType: this.setType ?? SetType.assign,
        }
    }

    get ex(): object {
        if (this.format !== undefined) {
            return {
                format: this.format,
            };
        }
    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        if (this.name === 'item') debugger;
        super.buildPhrases(phrases, prefix);
    }
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

export class BizBudInt extends BizBudValue {
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

export class BizBudDec extends BizBudValue {
    readonly dataType = BudDataType.dec;
    readonly canIndex = false;
    fraction: number;       // decimal fraction digits count
    get ex(): object {
        if (this.format !== undefined || this.fraction !== undefined) {
            return {
                format: this.format,
                fraction: this.fraction,
            };
        }
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDec(this, context);
    }
}

export class BizBudChar extends BizBudValue {
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

export class BizBudDate extends BizBudValue {
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

export class BizBudAtom extends BizBudValue {
    readonly dataType = BudDataType.atom;
    readonly canIndex = true;
    atom: BizAtomID;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudAtom(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, atom: this.atom?.name };
    }
    get objName(): string { return this.atom?.phrase; }
}
/*
export interface BizSubItem {
    id: number;
    name: string;
    caption: string;
    value: number | string;
}
*/
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
