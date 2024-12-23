"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementError = exports.BBizStatement = void 0;
const sql_1 = require("../../sql");
const bstatement_1 = require("../../bstatement/bstatement");
class BBizStatement extends bstatement_1.BStatement {
    head(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.head(sqls);
    }
    body(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.body(sqls);
    }
    foot(sqls) {
        let bSub = this.istatement.sub.db(this.context);
        bSub.foot(sqls);
    }
}
exports.BBizStatement = BBizStatement;
class BBizStatementError extends bstatement_1.BStatement {
    body(sqls) {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        let setError = factory.createSet();
        sqls.push(setError);
        setError.isAtVar = true;
        const { pendOver, message } = this.istatement;
        let msg;
        if (pendOver !== undefined) {
            msg = 'PEND';
            setError.equ('checkPend', new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar('checkPend'), new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('pend'), new sql_1.ExpVar('$pend'), new sql_1.ExpStr('overValue'), this.context.expVal(pendOver))));
        }
        else {
            msg = 'BIN';
            setError.equ('checkBin', new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar('checkBin'), new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('bin'), new sql_1.ExpVar('$bin'), new sql_1.ExpStr('message'), this.context.expVal(message))));
        }
        memo.text = 'ERROR ' + msg;
    }
}
exports.BBizStatementError = BBizStatementError;
//# sourceMappingURL=biz.statement.js.map