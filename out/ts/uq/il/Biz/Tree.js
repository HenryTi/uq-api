"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTree = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizTree extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.tree;
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