"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatement = void 0;
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const bstatement_1 = require("./bstatement");
const t1 = 't1';
const pageStart = '$pageStart';
class BFromStatement extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'FROM';
        const { asc, cols, ban, where, bizEntityTable, bizEntityArr } = this.istatement;
        const bizEntity0 = bizEntityArr[0];
        const ifStateNull = factory.createIf();
        sqls.push(ifStateNull);
        ifStateNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(pageStart));
        const setPageState = factory.createSet();
        ifStateNull.then(setPageState);
        let expStart, cmpStart;
        let varStart = new sql_1.ExpVar(pageStart);
        if (asc === 'asc') {
            expStart = new sql_1.ExpNum(0);
            cmpStart = new sql_1.ExpGT(new sql_1.ExpField('id', t1), varStart);
        }
        else {
            expStart = new sql_1.ExpStr('9223372036854775807');
            cmpStart = new sql_1.ExpLT(new sql_1.ExpField('id', t1), varStart);
        }
        setPageState.equ(pageStart, expStart);
        const select = factory.createSelect();
        sqls.push(select);
        select.column(new sql_1.ExpField('id', t1), 'id');
        if (ban === undefined) {
            select.column(sql_1.ExpNum.num0, 'ban');
        }
        else {
            select.column(this.context.expCmp(ban.val), 'ban');
        }
        const arr = [];
        for (let col of cols) {
            const { name, val, bud, entity } = col;
            const colArr = [];
            if (bud !== undefined) {
                if (entity !== undefined) {
                    colArr.push(new sql_1.ExpNum(entity.id));
                }
                colArr.push(new sql_1.ExpNum(bud.id));
            }
            else {
                colArr.push(new sql_1.ExpStr(name));
            }
            colArr.push(this.context.expVal(val));
            arr.push(new sql_1.ExpFunc('JSON_ARRAY', ...colArr));
        }
        select.from(new statementWithFrom_1.EntityTable(bizEntityTable, false, t1));
        select.column(new sql_1.ExpFunc('JSON_ARRAY', ...arr), 'json');
        let fieldBase = new sql_1.ExpField('base', t1);
        let expBase = bizEntityArr.length === 1 ?
            new sql_1.ExpEQ(fieldBase, new sql_1.ExpNum(bizEntity0.id))
            :
                new sql_1.ExpIn(fieldBase, ...bizEntityArr.map(v => new sql_1.ExpNum(v.id)));
        let wheres = [
            cmpStart,
            expBase,
            this.context.expCmp(where),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        select.order(new sql_1.ExpField('id', t1), asc);
        select.limit(new sql_1.ExpVar('$pageSize'));
    }
}
exports.BFromStatement = BFromStatement;
//# sourceMappingURL=from.js.map