"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PExecSqlStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
class PExecSqlStatement extends statement_1.PStatement {
    constructor(execSqlStatement, context) {
        super(execSqlStatement, context);
        this.execSqlStatement = execSqlStatement;
    }
    _parse() {
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.execSqlStatement.sql = val;
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.toVar = this.ts.passVar();
        }
    }
    scan(space) {
        let ok = true;
        let { sql } = this.execSqlStatement;
        if (sql.pelement.scan(space) === false)
            ok = false;
        if (this.toVar) {
            this.execSqlStatement.toVar = this.toVar;
            this.execSqlStatement.toVarPointer = space.varPointer(this.toVar, false);
        }
        return ok;
    }
}
exports.PExecSqlStatement = PExecSqlStatement;
//# sourceMappingURL=execSql.js.map