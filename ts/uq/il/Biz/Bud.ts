import {
    PBizBudAtom, PBizBudChar, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudIntOf, PBizBudNone, PBizBudRadio, PContext, PElement
} from "../../parser";
import { IElement } from "../element";
import { BizBase, BudDataType } from "./Base";
import { BizAtom } from "./Atom";
import { BizOptions, OptionsItemValueType } from "./Options";
import { BudFlag } from "./Entity";

export abstract class BizBud extends BizBase {
    readonly type: string;
    abstract get dataType(): 'none' | 'int' | 'dec' | 'char' | 'date' | 'ID' | 'atom' | 'intof' | 'radio' | 'check';
    abstract get canIndex(): boolean;
    get objName(): string { return undefined; }
    get dataTypeNum(): number {
        return BudDataType[this.dataType] ?? 0;
    }
    value: string | number;
    hasHistory: boolean;
    // hasIndex: boolean;
    flag: BudFlag = BudFlag.none;
    get optionsItemType(): OptionsItemValueType { return; }
    constructor(type: string, name: string, caption: string) {
        super();
        this.type = type;
        this.name = name;
        this.caption = caption;
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, dataType: this.dataType, value: this.value, history: this.hasHistory === true ? true : undefined }
    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        super.buildPhrases(phrases, prefix);
        /*
        if (this.hasIndex === true) {
            let phrase = this.phrase + '.$index';
            phrases.push([phrase, '', '', '0']);
        }
        */
    }
}

export class BizBudNone extends BizBud {
    readonly dataType = 'none';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudNone(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudInt extends BizBud {
    readonly dataType = 'int';
    readonly canIndex = true;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudInt(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudDec extends BizBud {
    readonly dataType = 'dec';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDec(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudChar extends BizBud {
    readonly dataType = 'char';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudChar(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}

export class BizBudDate extends BizBud {
    readonly dataType = 'date';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDate(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
/*
export class BizBudID extends BizBud {
    readonly dataType = 'ID';
    ID: ID;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudID(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return { ...ret, ID: this.ID?.name };
    }
}
*/
export class BizBudAtom extends BizBud {
    readonly dataType = 'atom';
    readonly canIndex = true;
    atom: BizAtom;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudAtom(this, context);
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
        return { ...ret, atom: this.atom?.name };
    }
    get objName(): string { return this.atom?.phrase; }
}

export interface BizSubItem {
    name: string;
    caption: string;
    value: number | string;
}

export abstract class BizBudOptions extends BizBud {
    readonly items: BizSubItem[] = [];
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
    readonly dataType = 'intof';
    readonly canIndex = true;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudIntOf(this, context);
    }
}

export class BizBudRadio extends BizBudOptions {
    readonly dataType = 'radio';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudRadio(this, context);
    }
}

export class BizBudCheck extends BizBudOptions {
    readonly dataType = 'check';
    readonly canIndex = false;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCheck(this, context);
    }
}
