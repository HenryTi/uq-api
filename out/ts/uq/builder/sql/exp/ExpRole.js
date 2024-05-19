"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpRole = void 0;
const il_1 = require("../../../il");
const dbContext_1 = require("../../dbContext");
const statementWithFrom_1 = require("../statementWithFrom");
const Exp_1 = require("./Exp");
const exps_1 = require("./exps");
class ExpRole extends Exp_1.Exp {
    constructor(role, valUnit) {
        super();
        this.role = role;
        this.valUnit = valUnit;
    }
    to(sb) {
        let { factory } = sb;
        let tblUserSite = (0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite);
        sb.l();
        let select = factory.createSelect();
        if (this.role === 'owner') {
            buildAdminOwner(select, exps_1.ExpNum.num2);
        }
        else if (this.role === 'admin') {
            buildAdminOwner(select, exps_1.ExpNum.num1);
        }
        else {
            buildRole(select);
        }
        sb.exists(select);
        sb.r();
        function buildAdminOwner(select, adminOrOwner) {
            select.col('user');
            select.from(tblUserSite);
            select.where(new exps_1.ExpAnd(new exps_1.ExpEQ(new exps_1.ExpField('unit'), this.valUnit ?? exps_1.ExpNum.num0), new exps_1.ExpEQ(new exps_1.ExpField('user'), new exps_1.ExpVar('$user')), new exps_1.ExpEQ(new exps_1.ExpBitAnd(new exps_1.ExpField('admin'), adminOrOwner), adminOrOwner)));
        }
        function buildRole(select) {
            let a = 'a';
            let b = 'b';
            select.col('user', a);
            select.from(tblUserSite);
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('$ixrole', false, b))
                .on(new exps_1.ExpEQ(new exps_1.ExpField('id', a), new exps_1.ExpField('i', b)));
            select.where(new exps_1.ExpAnd(new exps_1.ExpEQ(new exps_1.ExpField('site', a), this.valUnit ?? exps_1.ExpNum.num0), new exps_1.ExpEQ(new exps_1.ExpField('user', a), new exps_1.ExpVar('$user')), new exps_1.ExpEQ(new exps_1.ExpField('x', b), new exps_1.ExpFuncInUq('$textid', [new exps_1.ExpStr(this.role)], true))));
        }
    }
}
exports.ExpRole = ExpRole;
//# sourceMappingURL=ExpRole.js.map