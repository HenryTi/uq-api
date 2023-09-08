"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BExecSqlStatement = void 0;
const bstatement_1 = require("./bstatement");
const sql_1 = require("../sql");
class BExecSqlStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { sql, toVarPointer, toVar } = this.istatement;
        let factory = this.context.factory;
        let execSql = factory.createExecSql();
        sqls.push(execSql);
        execSql.toVar = toVar;
        execSql.toVarPoint = toVarPointer;
        execSql.sql = (0, sql_1.convertExp)(this.context, sql);
    }
}
exports.BExecSqlStatement = BExecSqlStatement;
//# sourceMappingURL=execSql.js.map