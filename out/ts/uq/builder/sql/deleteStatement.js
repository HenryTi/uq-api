"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruncateStatement = exports.DeleteStatement = void 0;
const statementWithFrom_1 = require("./statementWithFrom");
const statement_1 = require("./statement");
class DeleteStatement extends statementWithFrom_1.WithFrom {
}
exports.DeleteStatement = DeleteStatement;
class TruncateStatement extends statement_1.StatementBase {
}
exports.TruncateStatement = TruncateStatement;
//# sourceMappingURL=deleteStatement.js.map