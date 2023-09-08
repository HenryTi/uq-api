import { IElement } from "../element";

export enum EnumBizType {
    atom = 1,
    sheet = 2,
    key = 11,
    prop = 12,
    assign = 13,
    permit = 14,
    with = 15,
    role = 16,
};

export abstract class BizBase extends IElement {
    name: string;
    jName: string;
    ver: number;
    caption: string;
    phrase: string;

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
    buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        let phrase = `${prefix}.${this.name}`;
        phrases.push([phrase, this.caption ?? '', this.basePhrase, this.getTypeNum()]);
        this.phrase = phrase;
    }

    getTypeNum(): string {
        let n = EnumBizType[this.type] ?? 0;
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
