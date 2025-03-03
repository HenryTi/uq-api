"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementState = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const select_1 = require("../../sql/select");
const a = 'a', b = 'b';
class BBizStatementState extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const { to, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const memo = factory.createMemo();
        sqls.push(memo);
        let toText;
        if (to === undefined) {
            debugger;
            toText = '';
        }
        else if (typeof to === 'number') {
            toText = il_1.EnumStateTo[to].toUpperCase();
        }
        else {
            toText = to.name;
        }
        memo.text = 'Biz State ' + toText;
        const tblIxState = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false);
        const varSheet = new sql_1.ExpVar('$sheet');
        let del = factory.createDelete();
        sqls.push(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false, a));
        del.where(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varSheet));
        function insertTo(toId) {
            insertToCols(varSheet, new sql_1.ExpNum(toId));
        }
        function insertToCols(iVal, xVal) {
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.table = tblIxState;
            insert.cols = [
                { col: 'i', val: iVal },
                { col: 'x', val: xVal },
            ];
        }
        if (typeof to === 'number') {
            switch (to) {
                default:
                    debugger;
                    break;
                case il_1.EnumStateTo.start:
                    let selectMe = factory.createSelect();
                    insertToCols(new sql_1.ExpSelect(selectMe), varSheet);
                    selectMe.col('operator');
                    selectMe.lock = select_1.LockType.none;
                    selectMe.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.sheet, false));
                    selectMe.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), varSheet));
                    break;
                case il_1.EnumStateTo.end:
                    insertTo(sheet.id);
                    break;
                case il_1.EnumStateTo.back:
                    debugger;
                    break;
            }
        }
        else {
            insertTo(to.id);
        }
    }
}
exports.BBizStatementState = BBizStatementState;
//# sourceMappingURL=biz.statement.state.js.map