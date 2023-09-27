"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTab = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizTab extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.tab;
    }
    parser(context) {
        return new parser_1.PBizTab(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
}
exports.BizTab = BizTab;
//# sourceMappingURL=Tab.js.map