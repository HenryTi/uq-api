"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpFuncBetween = void 0;
const core_1 = require("../../../../core");
const il_1 = require("../../../il");
const select_1 = require("../select");
const statementWithFrom_1 = require("../statementWithFrom");
const Exp_1 = require("./Exp");
const exps_1 = require("./exps");
// memo 1
class ExpFuncBetween extends Exp_1.Exp {
    constructor(funcBetween, value, left, right) {
        super();
        this.funcBetween = funcBetween;
        this.value = value;
        this.left = left;
        this.right = right;
    }
    to(sb) {
        const { factory } = sb;
        const { betweenType, leftCompare, rightCompare } = this.funcBetween;
        const { value, left, right } = this;
        const varSite = new exps_1.ExpVar(core_1.consts.$site);
        function addParams() {
            sb.l().exp(varSite)
                .comma().exp(new exps_1.ExpVar(core_1.consts.$user))
                .comma().exp(value)
                .comma().exp(left)
                .comma().exp(new exps_1.ExpNum(leftCompare))
                .comma().exp(right)
                .comma().exp(new exps_1.ExpNum(rightCompare));
        }
        sb.dbName();
        switch (betweenType) {
            case il_1.EnumFuncBetweenType.iddate:
                sb.dot().append('IdDateBetween');
                addParams();
                const selectTimezone = factory.createSelect();
                selectTimezone.lock = select_1.LockType.none;
                selectTimezone.col('timezone');
                selectTimezone.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.site, false));
                selectTimezone.where(new exps_1.ExpEQ(new exps_1.ExpField('id'), varSite));
                sb.comma().exp(new exps_1.ExpSelect(selectTimezone));
                break;
            case il_1.EnumFuncBetweenType.date:
                sb.append('DateBetween');
                addParams();
                break;
            case il_1.EnumFuncBetweenType.int:
                sb.append('IntBetween');
                addParams();
                break;
            case il_1.EnumFuncBetweenType.dec:
                sb.append('DecBetween');
                addParams();
                break;
        }
        sb.r();
    }
}
exports.ExpFuncBetween = ExpFuncBetween;
//# sourceMappingURL=ExpFuncBetween.js.map