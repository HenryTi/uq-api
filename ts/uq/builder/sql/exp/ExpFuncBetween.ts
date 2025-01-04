import { consts } from "../../../../core";
import { EnumFuncBetweenType, EnumSysTable, FuncBetween, ValueExpression } from "../../../il";
import { SqlBuilder } from "../sqlBuilder";
import { EntityTable } from "../statementWithFrom";
import { Exp } from "./Exp";
import { ExpEQ, ExpField, ExpNum, ExpSelect, ExpVal, ExpVar } from "./exps";

// memo 1
export class ExpFuncBetween extends Exp {
    private readonly funcBetween: FuncBetween;
    private readonly value: ExpVal;
    private readonly left: ExpVal;
    private readonly right: ExpVal;
    constructor(funcBetween: FuncBetween, value: ExpVal, left: ExpVal, right: ExpVal) {
        super();
        this.funcBetween = funcBetween;
        this.value = value;
        this.left = left;
        this.right = right;
    }
    to(sb: SqlBuilder) {
        const { factory } = sb;
        const { betweenType, leftCompare, rightCompare } = this.funcBetween;
        const { value, left, right } = this;
        function addParams() {
            sb.comma().exp(value)
                .comma().exp(left)
                .comma().exp(new ExpNum(leftCompare))
                .comma().exp(right)
                .comma().exp(new ExpNum(rightCompare));
        }
        sb.l();
        switch (betweenType) {
            case EnumFuncBetweenType.iddate:
                sb.append('IdDateBetween');
                addParams();
                const selectTimezone = factory.createSelect();
                selectTimezone.col('timezone');
                selectTimezone.from(new EntityTable(EnumSysTable.site, false));
                selectTimezone.where(new ExpEQ(new ExpField('id'), new ExpVar(consts.$site)));
                sb.comma().exp(new ExpSelect(selectTimezone));
                break;
            case EnumFuncBetweenType.date:
                sb.append('DateBetween');
                addParams();
                break;
            case EnumFuncBetweenType.int:
                sb.append('IntBetween');
                addParams();
                break;
            case EnumFuncBetweenType.dec:
                sb.append('DecBetween');
                addParams();
                break;
        }
        sb.r();
    }
}
