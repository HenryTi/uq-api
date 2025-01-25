"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = void 0;
const parser_1 = require("../../../parser");
const biz_from_1 = require("./biz.from");
class FromStatementInPend extends biz_from_1.FromStatement {
    constructor(parent, pendQuery) {
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
//# sourceMappingURL=biz.pend.from.js.map