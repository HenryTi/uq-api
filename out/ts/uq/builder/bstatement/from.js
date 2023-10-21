"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatement = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
const dbContext_1 = require("../dbContext");
const t1 = 't1';
class BFromStatement extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';
        const { asc, cols, where } = this.istatement;
        const select = factory.createSelect();
        sqls.push(select);
        select.column(new sql_1.ExpNum(1000), 'id');
        select.column(sql_1.ExpNum.num0, 'ban');
        const arr = [];
        for (let col of cols) {
            const { name, val } = col;
            arr.push(new sql_1.ExpStr(name), this.context.expVal(val));
        }
        let tbl;
        function atomSelect() {
            tbl = dbContext_1.EnumSysTable.atom;
        }
        function specSelect() {
            tbl = dbContext_1.EnumSysTable.spec;
        }
        function binSelect() {
            tbl = dbContext_1.EnumSysTable.bizBin;
        }
        function sheetSelect() {
            tbl = dbContext_1.EnumSysTable.sheet;
        }
        function pendSelect() {
            tbl = dbContext_1.EnumSysTable.pend;
        }
        const { bizPhraseType } = this.istatement;
        switch (bizPhraseType) {
            case il_1.BizPhraseType.atom:
                atomSelect();
                break;
            case il_1.BizPhraseType.spec:
                specSelect();
                break;
            case il_1.BizPhraseType.bin:
                binSelect();
                break;
            case il_1.BizPhraseType.sheet:
                sheetSelect();
                break;
            case il_1.BizPhraseType.pend:
                pendSelect();
                break;
        }
        select.from(new statementWithFrom_1.EntityTable(tbl, false, t1));
        select.column(new sql_1.ExpFunc('JSON_OBJECT', ...arr), 'json');
        select.where(this.context.expCmp(where));
        select.order(new sql_1.ExpField('id', t1), asc);
    }
}
exports.BFromStatement = BFromStatement;
//# sourceMappingURL=from.js.map