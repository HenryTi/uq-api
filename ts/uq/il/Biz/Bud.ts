import { PBizBudAtom, PBizBudChar, PBizBudCheck, PBizBudDate, PBizBudDec, PBizBudID, PBizBudInt, PBizBudItems as PBizBudOptions, PBizBudNone, PBizBudRadio, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizBase } from "./Base";
import { BizAtom } from "./Atom";
import { ID, IX } from "../entity";

export abstract class BizBud extends BizBase {
    readonly type: string;
    abstract get dataType(): 'none' | 'int' | 'dec' | 'char' | 'date' | 'ID' | 'atom' | 'radio' | 'check';
    value: string | number;
    hasHistory: boolean;
    hasIndex: boolean;
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
            let phrase = `${prefix}.${this.name}.$index`;
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
}

export interface BizSubItem {
    name: string;
    caption: string;
    value: number | string;
}

export abstract class BizBudSubItems extends BizBud {
    readonly items: BizSubItem[] = [];
    budOptionsName: string;
    buildSchema() {
        let ret = super.buildSchema();
        return {
            ...ret, items: this.items.map(v => {
                let { name, caption, value } = v;
                return [name, caption, value];
            })
        };
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        super.buildPhrases(phrases, prefix);
        let phrase = `${prefix}.${this.name}`;
        for (let item of this.items) {
            phrases.push([`${phrase}.${item.name}`, item.caption ?? '', '', this.getTypeNum()]);
        }
    }
}

export class BizBudOptions extends BizBudSubItems {
    readonly dataType = 'radio';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudOptions(this, context);
    }
}

export class BizBudRadio extends BizBudSubItems {
    readonly dataType = 'radio';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudRadio(this, context);
    }
}

export class BizBudCheck extends BizBudSubItems {
    readonly dataType = 'check';
    parser(context: PContext): PElement<IElement> {
        return new PBizBudCheck(this, context);
    }
}
