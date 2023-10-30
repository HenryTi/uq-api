"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizExpOperand = void 0;
const exps_1 = require("./exps");
/*
export class ExpBizSelectOperand extends ExpVal {
    protected readonly select: BBizSelect
    constructor(select: BBizSelect) {
        super();
        this.select = select;
    }
    to(sb: SqlBuilder) {
        this.select.to(sb);
    }
}
*/
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
//# sourceMappingURL=ExpBizOperand.js.map