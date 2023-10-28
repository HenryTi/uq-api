"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizRole = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
/*
export class BizPermitItem extends BizBud {
    // permit: BizPermit;
    readonly dataType = BudDataType.none;
    parser(context: PContext): PElement<IElement> {
        return new PBizPermitItem(this, context);
    }
}

export class BizPermit extends BizEntity {
    readonly bizPhraseType = BizPhraseType.permit;
    protected readonly fields = [];
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
            phrases.push([itemPhrase, caption ?? '', phrase, this.typeNum]);
            value.phrase = itemPhrase;
        }
    }
    buildSchema(res: { [phrase: string]: string }) {
        let ret = super.buildSchema(res);
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
*/
class BizRole extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.permit; //.role;
        this.fields = [];
        this.roles = new Map();
    }
    get type() { return 'permit'; }
    parser(context) {
        return new parser_1.PBizRole(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
}
exports.BizRole = BizRole;
//# sourceMappingURL=Role.js.map