import {
    PBizBudAtom, PBizBudChar, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudNone, PBizBudRadio, PContext, PElement
} from "../../parser";
import { IElement } from "../element";
import { BizBase, BudDataType } from "./Base";
import { BizAtom } from "./Atom";
import { BizOptions, OptionsItemValueType } from "./Options";

export abstract class BizBud extends BizBase {
    readonly type: string;
    abstract get dataType(): 'none' | 'int' | 'dec' | 'char' | 'date' | 'ID' | 'atom' | 'radio' | 'check';
    get objName(): string { return undefined; }
    get dataTypeNum(): number {
        return BudDataType[this.dataType] ?? 0;
    }
    value: string | number;
    hasHistory: boolean;
    hasIndex: boolean;
    get optionsItemType(): OptionsItemValueType { return; }
    constructor(type: string, name: string, caption: string) {
        super();
        this.type = type;
        this.name = name;
        this.caption = caption;
    }
    buildSchema() {
        let ret = super.buildSchema();
        return { ...ret, dataType: this.dataType, value: this.value, history: this.hasHistory === true ? true : undefined }
    }

    override buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        super.buildPhrases(phrases, prefix);
        if (this.hasIndex === true) {
            let phrase = this.phrase + '.$index';
            phrases.push([phrase, '', '', '0']);
        }
    }
}

export class BizBudNone extends BizBud {
    readonly dataType = 'none';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudNone(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}

export class BizBudInt extends BizBud {
    readonly dataType = 'int';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudInt(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}

export class BizBudDec extends BizBud {
    readonly dataType = 'dec';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDec(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}

export class BizBudChar extends BizBud {
    readonly dataType = 'char';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudChar(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return ret;
    }
}

export class BizBudDate extends BizBud {
    readonly dataType = 'date';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudDate(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
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
    atom: BizAtom;
    parser(context: PContext): PElement<IElement> {
        return new PBizBudAtom(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
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
    buildSchema() {
        let ret = super.buildSchema();
        return {
            ...ret, options: this.options?.phrase
        };
    }
    get objName(): string { return this.options?.phrase; }
}

export class BizBudRadio extends BizBudOptions {
    readonly dataType = 'radio';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudRadio(this, context);
    }
}

export class BizBudCheck extends BizBudOptions {
    readonly dataType = 'check';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCheck(this, context);
    }
}
