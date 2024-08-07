"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizTie = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class BizTie extends Entity_1.BizNotID {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.tie;
        this.fields = ['i', 'x'];
        this.i = {};
        this.x = {};
    }
    parser(context) {
        return new parser_1.PBizTie(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.i = this.ixFieldSchema(this.i);
        ret.x = this.ixFieldSchema(this.x);
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizTie(dbContext, this);
    }
}
exports.BizTie = BizTie;
//# sourceMappingURL=Tie.js.map