"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetStatement = void 0;
const parser_1 = require("../../parser");
const Statement_1 = require("./Statement");
class SetStatement extends Statement_1.Statement {
    get type() { return 'set'; }
    db(db) { return db.setStatement(this); }
    parser(context) { return new parser_1.PSetStatement(this, context); }
}
exports.SetStatement = SetStatement;
//# sourceMappingURL=set.js.map