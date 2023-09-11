import { IElement } from "../element";

export enum BizPhraseType {
    atom = 11,
    uom = 12,
    spec = 13,
    sheet = 101,
    role = 201,
    permit = 202,

    with = 151,

    key = 1001,
    prop = 1011,
    assign = 1021,
};

export enum BudDataType {
    none = 0,
    int = 11,                   // bigint
    atom = 12,                  // atom id
    radio = 13,                 // single radio ids
    check = 14,                 // multiple checks
    ID = 19,
    dec = 21,                   // dec(18.6)
    char = 31,                  // varchar(100)
    str = 32,                   // varchar(100)
    date = 41,
};

export abstract class BizBase extends IElement {
    name: string;
    jName: string;
    ver: number;
    caption: string;
    phrase: string;
    memo: string;

    setJName(jName: string) {
        if (jName === undefined) return;
        if (jName === this.name) return;
        this.jName = jName;
    }

    buildSchema(): any {
        return {
            name: this.name,
            jName: this.jName,
            type: this.type,
            caption: this.caption,
        }
    };
    checkName(name: string): boolean {
        return true;
    }
    get basePhrase(): string { return ''; }

    protected buildPhrase(prefix: string) {
        this.phrase = `${prefix}.${this.name}`;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        this.buildPhrase(prefix);
        phrases.push([this.phrase, this.caption ?? '', this.basePhrase, this.getTypeNum()]);
    }

    getTypeNum(): string {
        let n = BizPhraseType[this.type] ?? 0;
        return String(n);
    }

    getBizBase(bizName: string[]): BizBase {
        let len = bizName.length;
        let ret: BizBase;
        let [n0] = bizName;
        if (this.name !== n0) {
            ret = this.getBizBase1(n0)
            if (ret === undefined) return;
        }
        else {
            ret = this;
        }
        for (let i = 1; i < len; i++) {
            ret = ret.getBizBase1(bizName[i]);
            if (ret === undefined) break;
        }
        return ret;
    }
    getBizBase1(bizName: string): BizBase {
        return;
        // if (this.name === bizName) return this;
    }
}
