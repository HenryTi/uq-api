"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = exports.FromStatement = exports.FromEntity = void 0;
const parser_1 = require("../../../parser");
const Statement_1 = require("../Statement");
class FromEntity {
    constructor() {
        this.bizEntityArr = [];
        this.ofIXs = [];
    }
}
exports.FromEntity = FromEntity;
class FromStatement extends Statement_1.Statement {
    get type() { return 'from'; }
    constructor(parent) {
        super(parent);
        this.cols = [];
        this.fromEntity = new FromEntity();
    }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
}
exports.FromStatement = FromStatement;
class FromStatementInPend extends FromStatement {
    constructor(parent, pendQuery /*PendQuery*/) {
        super(parent);
        this.pendQuery = pendQuery;
    }
    parser(context) {
        return new parser_1.PFromStatementInPend(this, context);
    }
    db(db) {
        return db.fromStatementInPend(this);
    }
}
exports.FromStatementInPend = FromStatementInPend;
//# sourceMappingURL=biz.from.js.map