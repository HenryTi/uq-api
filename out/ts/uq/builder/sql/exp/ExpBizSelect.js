"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizExpOperand = exports.ExpBizSelectOperand = void 0;
const exps_1 = require("./exps");
class ExpBizSelectOperand extends exps_1.ExpVal {
    constructor(select) {
        super();
        this.select = select;
    }
    to(sb) {
        this.select.to(sb);
    }
}
exports.ExpBizSelectOperand = ExpBizSelectOperand;
class BizExpOperand extends exps_1.ExpVal {
    constructor(bizExp) {
        super();
        this.bizExp = bizExp;
    }
    to(sb) {
        this.bizExp.to(sb);
    }
}
exports.BizExpOperand = BizExpOperand;
//# sourceMappingURL=ExpBizSelect.js.map