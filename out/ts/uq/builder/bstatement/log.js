"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLogStatement = void 0;
const bstatement_1 = require("./bstatement");
const sql_1 = require("../sql");
class BLogStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { unit, uq, subject, content, isError } = this.istatement;
        let { factory, unitFieldName } = this.context;
        let log = factory.createLog();
        log.isError = isError;
        sqls.push(log);
        log.unit = (0, sql_1.convertExp)(this.context, unit);
        if (!log.unit) {
            log.unit = new sql_1.ExpVar(unitFieldName);
        }
        log.uq = (0, sql_1.convertExp)(this.context, uq);
        if (!log.uq) {
            log.uq = new sql_1.ExpStr(this.context.dbName);
        }
        log.subject = (0, sql_1.convertExp)(this.context, subject);
        log.content = (0, sql_1.convertExp)(this.context, content);
    }
}
exports.BLogStatement = BLogStatement;
//# sourceMappingURL=log.js.map