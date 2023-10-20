"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFromStatement = void 0;
const sql_1 = require("../sql");
const bstatement_1 = require("./bstatement");
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
        select.column(new sql_1.ExpFunc('JSON_OBJECT', ...arr), 'json');
        select.where(this.context.expCmp(where));
        select.order(new sql_1.ExpField('id'), asc);
    }
}
exports.BFromStatement = BFromStatement;
//# sourceMappingURL=from.js.map