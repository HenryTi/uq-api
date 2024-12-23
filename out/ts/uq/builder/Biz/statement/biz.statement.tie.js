"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementTie = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
class BBizStatementTie extends bstatement_1.BStatement {
    body(sqls) {
        const { tie, i, x } = this.istatement;
        const { factory } = this.context;
        let insert = factory.createInsert();
        sqls.push(insert);
        let iVal = new sql_1.ExpFuncInUq('bud$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
            new sql_1.ExpNum(tie.id),
            this.context.expVal(i),
        ], true);
        insert.cols = [
            { col: 'i', val: iVal },
            { col: 'x', val: this.context.expVal(x) },
        ];
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false);
        insert.ignore = true;
    }
}
exports.BBizStatementTie = BBizStatementTie;
//# sourceMappingURL=biz.statement.tie.js.map