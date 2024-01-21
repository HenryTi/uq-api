"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTree = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizTree extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.tree;
        this.fields = [];
    }
    parser(context) {
        return new parser_1.PBizTree(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
}
exports.BizTree = BizTree;
//# sourceMappingURL=Tree.js.map