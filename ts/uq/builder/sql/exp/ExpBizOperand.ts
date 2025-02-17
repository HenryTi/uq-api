import { BBizExp } from "../../tools";
import { SqlBuilder } from "../sqlBuilder";
import { ExpVal } from "./exps";

export class BizExpOperand extends ExpVal {
    protected readonly bizExp: BBizExp;
    protected readonly iProp: number;
    constructor(bizExp: BBizExp, iProp: number) {
        super();
        this.bizExp = bizExp;
        this.iProp = iProp;
    }
    to(sb: SqlBuilder) {
        this.bizExp.to(sb, this.iProp);
    }
}
