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
        const insert = factory.createInsert();
        sqls.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.log, false);
        const varSite = new sql_1.ExpVar('$site');
        insert.cols.push({ col: 'id', val: new sql_1.ExpFuncInUq('log$id', [varSite, new sql_1.ExpVar(userParam.name), sql_1.ExpNum.num1, sql_1.ExpNull.null, varSite], true) }, { col: 'base', val: varSite }, { col: 'value', val: this.context.expVal(this.istatement.val) });
    }
}
exports.BBizLog = BBizLog;
//# sourceMappingURL=biz.log.js.map