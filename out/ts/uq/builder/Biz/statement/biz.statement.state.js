"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementState = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const a = 'a', b = 'b';
const pendFrom = '$pend';
const binId = '$bin';
class BBizStatementState extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const { to, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const memo = factory.createMemo();
        sqls.push(memo);
        let memoText = 'Biz State ';
        if (to === undefined) {
            memoText += 'END';
        }
        else {
            memoText += to.name;
        }
        memo.text = memoText;
        const tblIxState = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false);
        const varSheet = new sql_1.ExpVar('$sheet');
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false, a));
        del.where(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varSheet));
        let insert = factory.createInsert();
        sqls.push(insert);
        let expTo = new sql_1.ExpNum(to === undefined ? sheet.id : to.id);
        insert.table = tblIxState;
        insert.cols = [
            { col: 'i', val: varSheet },
            { col: 'x', val: expTo },
        ];
    }
}
exports.BBizStatementState = BBizStatementState;
//# sourceMappingURL=biz.statement.state.js.map