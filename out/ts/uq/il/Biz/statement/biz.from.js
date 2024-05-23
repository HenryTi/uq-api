"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = exports.FromStatement = exports.FromEntity = void 0;
const parser_1 = require("../../../parser");
const Entity_1 = require("../Entity");
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
const statement_1 = require("../../statement");
class FromEntity extends Entity_1.BizFromEntity {
}
exports.FromEntity = FromEntity;
class FromStatement extends statement_1.Statement {
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
    getBizEntityFromAlias(alias) {
        return this.getBizEntityArrFromAlias(alias, this.fromEntity);
    }
    getBizEntityArrFromAlias(alias, fromEntity) {
        if (alias === fromEntity.alias)
            return fromEntity;
        const { subs } = fromEntity;
        if (subs === undefined)
            return undefined;
        for (let sub of subs) {
            let ret = this.getBizEntityArrFromAlias(alias, sub);
            if (ret !== undefined)
                return ret;
        }
        return undefined;
    }
    setIdFromEntity(idAlias) {
        if (idAlias === undefined) {
            this.idFromEntity = this.fromEntity;
            return true;
        }
        else {
            this.idFromEntity = this.getBizEntityFromAlias(idAlias);
            return this.idFromEntity !== undefined;
        }
    }
}
exports.FromStatement = FromStatement;
class FromStatementInPend extends FromStatement {
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
//# sourceMappingURL=biz.from.js.map