"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatement = void 0;
const parser_1 = require("../../parser");
const statement_1 = require("./statement");
class FromStatement extends statement_1.Statement {
    constructor() {
        super(...arguments);
        this.tbls = [];
        this.cols = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
}
exports.FromStatement = FromStatement;
//# sourceMappingURL=from.js.map