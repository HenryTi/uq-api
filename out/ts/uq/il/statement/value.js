"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueStatement = exports.ValueXi = void 0;
const parser_1 = require("../../parser");
const Statement_1 = require("./Statement");
class ValueXi {
}
exports.ValueXi = ValueXi;
class ValueStatement extends Statement_1.Statement {
    get type() { return 'value'; }
    db(db) {
        return db.value(this);
    }
    parser(context) { return new parser_1.PValueStatement(this, context); }
}
exports.ValueStatement = ValueStatement;
//# sourceMappingURL=value.js.map