"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = exports.FromStatement = void 0;
const parser_1 = require("../../parser");
const Biz_1 = require("../Biz");
const statement_1 = require("./statement");
class FromStatement extends statement_1.Statement {
    constructor() {
        super(...arguments);
        this.bizEntityArr = [];
        this.ofIXs = [];
        this.cols = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
    /*
    getBud(fieldName: string): [BizEntity, BizBudValue] {
        let bizEntity: BizEntity = undefined;
        let bud: BizBudValue = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName) as BizBudValue;
            if (b !== undefined) {
                bizEntity = entity;
                bud = b;
            }
        }
        return [bizEntity, bud];
    }
    */
    getBizField(fieldName) {
        let bizEntity = undefined;
        let bud = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName);
            if (b !== undefined) {
                bizEntity = entity;
                bud = b;
            }
        }
        if (bud === undefined)
            return undefined;
        let ret = new Biz_1.BizFieldBud();
        ret.entity = bizEntity;
        ret.bud = bud;
        return ret;
    }
}
exports.FromStatement = FromStatement;
class FromStatementInPend extends FromStatement {
    parser(context) {
        return new parser_1.PFromStatementInPend(this, context);
    }
    db(db) {
        return db.fromStatementInPend(this);
    }
}
exports.FromStatementInPend = FromStatementInPend;
//# sourceMappingURL=from.js.map