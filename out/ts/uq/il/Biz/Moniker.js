"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizMoniker = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizMoniker extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.moniker;
    }
    parser(context) {
        return new parser_1.PBizMoniker(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
}
exports.BizMoniker = BizMoniker;
//# sourceMappingURL=Moniker.js.map