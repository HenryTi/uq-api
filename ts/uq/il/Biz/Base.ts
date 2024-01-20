import { IElement } from "../IElement";
import { Biz } from "./Biz";
import { UI } from "../UI";
import { BizPhraseType } from "./BizPhraseType";
import { BizIDExtendable } from "./BizID";
import { BizOptions } from "./Options";
import { PBizSearch, PContext, PElement } from "../../parser";
import { BizSheet } from "./Sheet";
import { BizEntity } from "./Entity";
import { BizBud } from "./Bud";

export abstract class BizBase extends IElement {
    readonly biz: Biz;
    id: number;                         // phrase id
    name: string;
    jName: string;
    ver: number;
    phrase: string;
    memo: string;
    ui: Partial<UI> = {};
    nameStartAt: number;

    constructor(biz: Biz) {
        super();
        this.biz = biz;
    }

    abstract get bizPhraseType(): BizPhraseType;
    get type(): string { return BizPhraseType[this.bizPhraseType]; }

    setJName(jName: string) {
        if (jName === undefined) return;
        if (jName === this.name) return;
        this.jName = jName;
    }
    getJName(): string { return this.jName ?? this.name }

    buildSchema(res: { [phrase: string]: string }): any {
        return {
            id: this.id,
            name: this.name,
            jName: this.jName,
            type: this.type,
            phrase: this.phrase,
            ui: {
                ...this.ui,
                caption: res[this.phrase] ?? this.ui?.caption,
            }
        }
    };
    getBud(name: string): BizBud {
        return undefined;
    }
    get extendsPhrase(): string { return ''; }

    protected buildPhrase(prefix: string) {
        this.phrase = `${prefix}.${this.name}`;
    }

    buildPhrases(phrases: [string, string, string, string][], prefix: string): void {
        this.buildPhrase(prefix);
        phrases.push([this.phrase, this.ui.caption ?? '', this.extendsPhrase, this.typeNum]);
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

// 专门用于 i 和 x。Tie 和 duo 里面需要
export interface IxField {
    caption: string;
    atoms: (BizIDExtendable | BizOptions)[];         // atoms === undefined 则 ME
}

export class BizSearch extends IElement {
    type = 'bizsearch';
    readonly bizEntity: BizEntity;
    readonly params: { entity: BizEntity; buds: BizBud[]; }[] = [];
    constructor(bizEntity: BizEntity) {
        super();
        this.bizEntity = bizEntity;
    }
    parser(context: PContext): PElement<IElement> {
        return new PBizSearch(this, context);
    }
}
