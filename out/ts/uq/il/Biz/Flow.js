"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flow = void 0;
const parser_1 = require("../../parser");
const BizPhraseType_1 = require("./BizPhraseType");
const Entity_1 = require("./Entity");
class Flow extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.flow;
        this.fields = [];
        this.isIDScan = false;
        this.sheets = [];
    }
    parser(context) {
        return new parser_1.PFlow(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.sheets = this.sheets.map(v => v.id);
        this.schema = ret;
        return ret;
    }
}
exports.Flow = Flow;
//# sourceMappingURL=Flow.js.map