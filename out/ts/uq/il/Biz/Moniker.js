"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizMoniker = void 0;
const parser_1 = require("../../parser");
const Entity_1 = require("./Entity");
class BizMoniker extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'moniker';
    }
    parser(context) {
        return new parser_1.PBizMoniker(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign({}, ret);
    }
}
exports.BizMoniker = BizMoniker;
//# sourceMappingURL=Moniker.js.map