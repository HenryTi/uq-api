"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTitle = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizTitle extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.title;
    }
    parser(context) {
        return new parser_1.PBizTitle(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
}
exports.BizTitle = BizTitle;
//# sourceMappingURL=Title.js.map