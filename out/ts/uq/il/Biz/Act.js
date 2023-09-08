"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAct = void 0;
const act_1 = require("../entity/act");
class BizAct extends act_1.Act {
    constructor(biz) {
        super(biz.uq);
        this.biz = biz;
    }
    get isBiz() { return true; }
}
exports.BizAct = BizAct;
//# sourceMappingURL=Act.js.map