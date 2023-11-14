"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInPend = exports.FromStatement = void 0;
const parser_1 = require("../../parser");
const Statement_1 = require("./Statement");
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
const BizPhraseType_1 = require("../Biz/BizPhraseType");
const BizField_1 = require("../BizField");
class FromStatement extends Statement_1.Statement {
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
    getBizField(fieldName) {
        switch (fieldName) {
            default:
                return this.getBudField(fieldName);
            case 'no':
            case 'ex':
                return this.getNoExField(fieldName);
        }
    }
    getBudField(fieldName) {
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
        let ret = new BizField_1.BizFieldBud();
        ret.entity = bizEntity;
        ret.bud = bud;
        return ret;
    }
    getNoExField(fieldName) {
        if (this.bizPhraseType === BizPhraseType_1.BizPhraseType.atom) {
            let ret = new BizField_1.BizFieldField();
            ret.tbl = 'atom';
            ret.fieldName = fieldName;
            return ret;
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
    getBizField(fieldName) {
        switch (fieldName) {
            default: return this.getBizPendMidField(fieldName);
            case 'no': return this.getBizPendSheetField(fieldName);
            case 'si':
            case 'sx':
            case 'svalue':
            case 'samount':
            case 'sprice': return this.getBizPendSheetBinField(fieldName);
            case 'i':
            case 'x':
            case 'value':
            case 'amount':
            case 'price': return this.getBizPendBinField(fieldName);
            case 'pendvalue': return this.getPendValueBinField();
        }
    }
    getBizPendMidField(fieldName) {
        let { bizPend } = this.pendQuery;
        let bud = bizPend.getBud(fieldName);
        if (bud === undefined)
            return;
        let ret = new BizField_1.BizFieldJsonProp();
        ret.tbl = 'pend';
        ret.bud = bud;
        ret.entity = bizPend;
        return ret;
    }
    getBizPendBinField(fieldName) {
        let ret = new BizField_1.BizFieldField();
        ret.tbl = 'bin';
        ret.fieldName = fieldName;
        return ret;
    }
    getBizPendSheetField(fieldName) {
        let ret = new BizField_1.BizFieldField();
        ret.tbl = 'sheet';
        ret.fieldName = fieldName;
        return ret;
    }
    getBizPendSheetBinField(fieldName) {
        let ret = new BizField_1.BizFieldField();
        ret.tbl = 'sheetBin';
        ret.fieldName = fieldName.substring(1);
        return ret;
    }
    getPendValueBinField() {
        let ret = new BizField_1.BizFieldField();
        ret.tbl = 'pend';
        ret.fieldName = 'pendvalue';
        return ret;
    }
}
exports.FromStatementInPend = FromStatementInPend;
//# sourceMappingURL=from.js.map