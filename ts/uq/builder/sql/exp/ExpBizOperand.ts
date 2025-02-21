import { BBizExp } from "../../tools";
import { SqlBuilder } from "../sqlBuilder";
import { ExpVal } from "./exps";

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
