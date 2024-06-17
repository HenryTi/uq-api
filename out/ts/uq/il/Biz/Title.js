"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTitle = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizTitle extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.book;
        this.isID = false;
        this.fields = [];
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