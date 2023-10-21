"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizRole = exports.BizPermit = exports.BizPermitItem = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
class BizPermitItem extends Bud_1.BizBud {
    constructor() {
        super(...arguments);
        // permit: BizPermit;
        this.dataType = Base_1.BudDataType.none;
    }
    parser(context) {
        return new parser_1.PBizPermitItem(this, context);
    }
}
exports.BizPermitItem = BizPermitItem;
class BizPermit extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.permit;
        this.fields = [];
        this.items = new Map();
        this.permits = new Map();
    }
    get type() { return 'permit'; }
    parser(context) {
        return new parser_1.PBizPermit(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
        let phrase = this.phrase;
        for (let [, value] of this.items) {
            let { name, caption } = value;
            let itemPhrase = `${phrase}.${name}`;
            phrases.push([itemPhrase, caption !== null && caption !== void 0 ? caption : '', phrase, this.typeNum]);
            value.phrase = itemPhrase;
        }
    }
    buildSchema(res) {
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
exports.BizPermit = BizPermit;
class BizRole extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.role;
        this.fields = [];
        this.roles = new Map();
    }
    get type() { return 'role'; }
    parser(context) {
        return new parser_1.PBizRole(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
}
exports.BizRole = BizRole;
//# sourceMappingURL=Role.js.map