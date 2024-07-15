"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizRole = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizRole extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.permit; //.role;
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