import { IElement } from "../element";

export enum BizPhraseType {
    any = 0,
    atom = 11,
    spec = 12,
    bud = 13,

    sheet = 101,
    bin = 102,
    pend = 104,
    detailAct = 111,
    with = 151,
    pick = 161,

    role = 201,
    permit = 202,
    options = 301,
    tree = 401,
    tie = 501,
    report = 601,
    title = 901,

    key = 1001,
    prop = 1011,
    optionsitem = 1031,
};

export enum BudDataType {
    none = 0,
    int = 11,                   // bigint
    atom = 12,                  // atom id
    radio = 13,                 // single radio ids
    check = 14,                 // multiple checks
    intof = 15,
    ID = 19,

    dec = 21,                   // dec(18.6)

    char = 31,                  // varchar(100)
    str = 32,                   // varchar(100)

    date = 41,
    datetime = 42,
};

export abstract class BizBase extends IElement {
    id: number;                         // phrase id
    name: string;
    jName: string;
    ver: number;
    caption: string;
    phrase: string;
    memo: string;
    abstract get bizPhraseType(): BizPhraseType;
    get type(): string { return BizPhraseType[this.bizPhraseType]; }

    setJName(jName: string) {
        if (jName === undefined) return;
        if (jName === this.name) return;
        this.jName = jName;
    }

    buildSchema(res: { [phrase: string]: string }): any {
        return {
            id: this.id,
            name: this.name,
            jName: this.jName,
            type: this.type,
            phrase: this.phrase,
            caption: res[this.phrase] ?? this.caption,
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
        phrases.push([this.phrase, this.caption ?? '', this.basePhrase, this.typeNum]);
    }

    get typeNum(): string {
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
