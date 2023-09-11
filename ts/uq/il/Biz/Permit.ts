import { PBizPermit, PBizRole, PContext, PElement } from "../../parser";
import { IElement } from "../element";
import { BizEntity } from "./Entity";

export interface BizPermitItem {
    permit: BizPermit;
    name: string;
    phrase: string;
    caption: string;
}

export class BizPermit extends BizEntity {
    readonly items = new Map<string, BizPermitItem>();
    readonly permits = new Map<string, BizPermit>();
    get type(): string { return 'permit'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizPermit(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let [, value] of this.items) {
            let { name, caption } = value;
            let itemPhrase = `${phrase}.${name}`;
            phrases.push([itemPhrase, caption ?? '', phrase, this.getTypeNum()]);
            value.phrase = itemPhrase;
        }
    }
    buildSchema() {
        let ret = super.buildSchema();
        let items = [], permits = [];
        for (let [, value] of this.items) {
            let { phrase, name, caption } = value;
            items.push({ phrase, name, caption });
        }
        for (let [, value] of this.permits) {
            permits.push(value.name);
        }
        return Object.assign(ret, { items, permits });
    }
}

export class BizRole extends BizEntity {
    readonly permitItems = new Map<string, BizPermitItem>();
    readonly permits = new Map<string, BizPermit>();
    readonly roles = new Map<string, BizRole>();
    get type(): string { return 'role'; }
    parser(context: PContext): PElement<IElement> {
        return new PBizRole(this, context);
    }
    buildPhrases(phrases: [string, string, string, string][], prefix: string) {
        super.buildPhrases(phrases, prefix);
    }
}
