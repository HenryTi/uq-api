"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizRole = exports.BizPermit = void 0;
const parser_1 = require("../../parser");
const Entity_1 = require("./Entity");
class BizPermit extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
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
            phrases.push([itemPhrase, caption !== null && caption !== void 0 ? caption : '', phrase, this.getTypeNum()]);
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
exports.BizPermit = BizPermit;
class BizRole extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.permitItems = new Map();
        this.permits = new Map();
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
//# sourceMappingURL=Permit.js.map