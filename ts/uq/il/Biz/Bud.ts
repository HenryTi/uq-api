import {
    PBizBudAtom, PBizBudChar, PBizBudCheck, PBizBudDate
    , PBizBudDec, PBizBudInt
    , PBizBudIntOf, PBizBudNone, PBizBudRadio, PContext, PElement
} from "../../parser";
import { IElement } from "../element";
import { BizBase, BizPhraseType, BudDataType } from "./Base";
import { BizAtom, BizAtomID } from "./Atom";
import { BizOptions, OptionsItemValueType } from "./Options";
import { BudFlag } from "./Entity";

export abstract class BizBud extends BizBase {
    readonly bizPhraseType = BizPhraseType.prop;

    abstract get dataType(): BudDataType;
    abstract get canIndex(): boolean;
    get objName(): string { return undefined; }
    value: string | number;
    hasHistory: boolean;
    flag: BudFlag = BudFlag.none;
    get optionsItemType(): OptionsItemValueType { return; }
    constructor(name: string, caption: string) {
        super();
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

export class BizBudInt extends BizBud {
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

export class BizBudDec extends BizBud {
    readonly dataType = BudDataType.dec;
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

export class BizBudDate extends BizBud {
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

export class BizBudAtom extends BizBud {
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
