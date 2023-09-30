"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTie = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizTie extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.tie;
    }
    parser(context) {
        return new parser_1.PBizTie(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizTie = BizTie;
//# sourceMappingURL=Tie.js.map