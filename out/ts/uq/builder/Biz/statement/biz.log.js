"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizLog = void 0;
const il_1 = require("../../../il");
const bstatement_1 = require("../../bstatement");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
class BBizLog extends bstatement_1.BStatement {
    body(sqls) {
        const { factory, userParam } = this.context;
        let { no } = this.istatement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let logId = 'logid_' + no;
        declare.vars((0, il_1.bigIntField)(logId));
        let setId = factory.createSet();
        sqls.push(setId);
        const varSite = new sql_1.ExpVar('$site');
        setId.equ(logId, new sql_1.ExpFuncInUq('log$id', [varSite, new sql_1.ExpVar(userParam.name), sql_1.ExpNum.num1, sql_1.ExpNull.null, varSite], true));
        const update = factory.createUpdate();
        sqls.push(update);
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.log, false);
        update.cols.push({ col: 'value', val: this.context.expVal(this.istatement.val) });
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(logId));
    }
}
exports.BBizLog = BBizLog;
//# sourceMappingURL=biz.log.js.map