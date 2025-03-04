"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementBinAct = void 0;
const sql_1 = require("../../sql");
const bstatement_1 = require("../../bstatement/bstatement");
const consts_1 = require("../../consts");
class BBizStatementBinAct extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
        const { context } = this;
        const { factory, site, varUser } = context;
        const { no, bizStatement: { bizAct: { binState: { bin, sheetState: { sheet } } } } } = this.istatement;
        if (bin.act === undefined)
            return;
        const execSql = factory.createExecSql();
        execSql.no = no;
        sqls.push(execSql);
        execSql.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr(`CALL \`${consts_1.$site}.${site}\`.\``), new sql_1.ExpNum(bin.id), new sql_1.ExpStr('`(?,?,?)'));
        execSql.parameters = [
            varUser, // $user
            new sql_1.ExpVar('$bin'),
        ];
    }
}
exports.BBizStatementBinAct = BBizStatementBinAct;
//# sourceMappingURL=biz.statement.binAct.js.map