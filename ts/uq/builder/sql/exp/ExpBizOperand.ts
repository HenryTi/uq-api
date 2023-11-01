import { BBizExp } from "../BizExp";
// import { BBizSelect } from "../select";
import { SqlBuilder } from "../sqlBuilder";
import { ExpVal } from "./exps";
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
export class BizExpOperand extends ExpVal {
    protected readonly bizExp: BBizExp;
    constructor(bizExp: BBizExp) {
        super();
        this.bizExp = bizExp;
    }
    to(sb: SqlBuilder) {
        this.bizExp.to(sb);
    }
}
