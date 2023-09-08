"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizQuery = void 0;
const entity_1 = require("../entity/entity");
class BizQuery extends entity_1.Query {
    constructor(biz) {
        super(biz.uq);
        this.biz = biz;
    }
    get isBiz() { return true; }
}
exports.BizQuery = BizQuery;
//# sourceMappingURL=Query.js.map