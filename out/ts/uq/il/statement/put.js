"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutStatement = void 0;
const parser_1 = require("../../parser");
const Statement_1 = require("./Statement");
class PutStatement extends Statement_1.Statement {
    db(db) {
        return db.putStatement(this);
    }
    parser(context) {
        return new parser_1.PPutStatement(this, context);
    }
}
exports.PutStatement = PutStatement;
//# sourceMappingURL=put.js.map