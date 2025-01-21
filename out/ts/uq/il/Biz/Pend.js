"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendQuery = exports.BizQueryTableInPendStatements = exports.BizPend = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const statement_1 = require("../statement");
const BizPhraseType_1 = require("./BizPhraseType");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
const Query_1 = require("./Query");
class BizPend extends Entity_1.BizID {
    constructor(biz) {
        super(biz);
        this.fields = [...BizPend.predefinedId, ...BizPend.predefinedValue];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.pend;
        this.main = undefined;
        this.predefinedFields = [];
        this.bizBins = [];
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new Bud_1.BizBudID(this, n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new Bud_1.BizBudDec(this, n, undefined);
        }
    }
    parser(context) {
        return new parser_1.PBizPend(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizPend(dbContext, this);
    }
    getBinBud(name) {
        for (let bizBin of this.bizBins) {
            let bud = bizBin.getBud(name);
            if (bud !== undefined)
                return bud;
        }
    }
    getSheetBud(name) {
        for (let bizBin of this.bizBins) {
            let bud = bizBin.getSheetMainBud(name);
            if (bud !== undefined)
                return bud;
        }
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let predefined = {};
        for (let i in this.predefinedBuds) {
            let bud = this.predefinedBuds[i];
            predefined[i] = bud.buildSchema(res);
        }
        ret.predefined = predefined;
        if (this.pendQuery !== undefined) {
            let { params, from } = this.pendQuery;
            const { cols, subCols } = from;
            ret.params = params.map(v => v.buildSchema(res));
            ret.cols = cols.map(v => {
                const bud = v.bud; // field.getBud();
                return bud === null || bud === void 0 ? void 0 : bud.buildSchema(res);
            });
            if (subCols !== undefined) {
                ret.subCols = subCols.map(v => v.bud.id);
            }
        }
        if (this.i !== undefined)
            ret.i = this.i.buildSchema(res);
        if (this.x !== undefined)
            ret.x = this.x.buildSchema(res);
        ret.predefinedFields = this.predefinedFields;
        return ret;
    }
    getBud(name) {
        let bud = this.getDefinedBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }
    getDefinedBud(name) {
        let bud = super.getBud(name);
        if (bud === undefined) {
            if (name === 'i')
                return this.i;
            if (name === 'x')
                return this.x;
        }
        return bud;
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.i !== undefined)
            callback(this.i);
        if (this.x !== undefined)
            callback(this.x);
        if (this.pendQuery === undefined)
            return;
        const { params, from } = this.pendQuery;
        const { cols } = from;
        for (let col of cols) {
            let bud = col.bud; // field?.getBud();
            if (bud === undefined)
                continue;
            callback(bud);
        }
        for (let param of params) {
            callback(param);
        }
    }
    hasField(fieldName) {
        let ret = this.fields.includes(fieldName);
        if (ret === true)
            return ret;
        if (fieldName === 'i' && this.i !== undefined)
            return true;
        if (fieldName === 'x' && this.x !== undefined)
            return true;
        if (this.props.has(fieldName) === true)
            return true;
        return false;
    }
}
exports.BizPend = BizPend;
BizPend.predefinedId = ['si', 'sx', 's', 'sheet'];
BizPend.predefinedValue = ['bin', 'value', 'price', 'amount', 'svalue', 'sprice', 'samount',];
class BizQueryTableInPendStatements extends statement_1.Statements {
    constructor(pendQuery) {
        super(undefined);
        this.pendQuery = pendQuery;
    }
    parser(context) {
        return new parser_1.PBizQueryTableInPendStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryTableInPendStatements = BizQueryTableInPendStatements;
class PendQuery extends Query_1.BizQueryTable {
    constructor(bizPend) {
        super(bizPend.biz);
        this.isIDScan = false;
        this.bizPend = bizPend;
    }
    parser(context) {
        return new parser_1.PPendQuery(this, context);
    }
}
exports.PendQuery = PendQuery;
//# sourceMappingURL=Pend.js.map