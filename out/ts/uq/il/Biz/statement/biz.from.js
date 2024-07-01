"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromInPendStatement = exports.FromStatement = void 0;
const parser_1 = require("../../../parser");
const biz_select_1 = require("./biz.select");
class FromStatement extends biz_select_1.BizSelectStatement {
    constructor() {
        super(...arguments);
        this.cols = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
    getIdFromEntity(idAlias) {
        if (idAlias === undefined) {
            return this.fromEntity;
        }
        return this.getBizFromEntityFromAlias(idAlias);
    }
}
exports.FromStatement = FromStatement;
class FromInPendStatement extends FromStatement {
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
exports.FromInPendStatement = FromInPendStatement;
//# sourceMappingURL=biz.from.js.map