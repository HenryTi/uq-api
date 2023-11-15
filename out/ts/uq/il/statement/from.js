"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = exports.FromStatement = void 0;
const parser_1 = require("../../parser");
const Statement_1 = require("./Statement");
class FromStatement extends Statement_1.Statement {
    constructor() {
        super(...arguments);
        this.bizEntityArr = [];
        this.ofIXs = [];
        this.cols = [];
        /*
        getBizField(fieldName: string): BizField {
            switch (fieldName) {
                default:
                    return this.getBudField(fieldName);
                case 'no':
                case 'ex':
                    return this.getNoExField(fieldName);
            }
        }
    
        private getBudField(fieldName: string): BizField {
            let bizEntity: BizEntity = undefined;
            let bud: BizBudValue = undefined;
            for (let entity of this.bizEntityArr) {
                let b = entity.getBud(fieldName) as BizBudValue;
                if (b !== undefined) {
                    bizEntity = entity;
                    bud = b;
                }
            }
            if (bud === undefined) return undefined;
            let ret = new BizFieldBud();
            ret.entity = bizEntity;
            ret.bud = bud;
            return ret;
        }
    
        private getNoExField(fieldName: string): BizField {
            if (this.bizPhraseType === BizPhraseType.atom) {
                let ret = new BizFieldField();
                ret.tbl = 'atom';
                ret.fieldName = fieldName;
                return ret;
            }
        }
        */
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
//# sourceMappingURL=from.js.map