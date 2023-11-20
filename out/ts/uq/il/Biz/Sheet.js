"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendQuery = exports.BizQueryTableInPendStatements = exports.BizPend = exports.BizSheet = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const statement_1 = require("../statement");
const BizPhraseType_1 = require("./BizPhraseType");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
const Query_1 = require("./Query");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = ['id', 'no'];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.sheet;
        this.details = [];
    }
    parser(context) {
        return new parser_1.PBizSheet(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.main === undefined)
            debugger;
        ret = Object.assign(Object.assign({}, ret), { main: this.main.name, details: this.details.map(v => {
                const { bin, caption } = v;
                return {
                    bin: bin.name,
                    caption, // 此处暂时不做res翻译
                };
            }) });
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizSheet(dbContext, this);
    }
}
exports.BizSheet = BizSheet;
class BizPend extends Entity_1.BizEntity {
    constructor(biz) {
        super(biz);
        this.fields = [...BizPend.predefinedId, ...BizPend.predefinedValue];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.pend;
        this.bizBins = [];
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new Bud_1.BizBudAtom(this.biz, n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new Bud_1.BizBudDec(this.biz, n, undefined);
        }
    }
    parser(context) {
        return new parser_1.PBizPend(this, context);
    }
    db(dbContext) {
        return new builder_1.BBizPend(dbContext, this);
    }
    getBinProps() {
        let budArr = [];
        for (let bizBin of this.bizBins) {
            for (let [, p] of bizBin.props) {
                budArr.push(p);
            }
        }
        return budArr;
    }
    getSheetProps() {
        let budArr = [];
        for (let bizBin of this.bizBins) {
            budArr.push(...bizBin.getSheetProps());
        }
        return budArr;
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
            ret.params = params.map(v => v.buildSchema(res));
            ret.cols = from.cols.map(v => {
                const bud = v.field.getBud();
                return bud === null || bud === void 0 ? void 0 : bud.buildSchema(res);
            });
        }
        if (this.i !== undefined)
            ret.i = this.i.buildSchema(res);
        if (this.x !== undefined)
            ret.x = this.x.buildSchema(res);
        return ret;
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
            if (bud === undefined) {
                if (name === 'i')
                    return this.i;
                if (name === 'x')
                    return this.x;
            }
        }
        return bud;
    }
    forEachBud(callback) {
        var _a;
        super.forEachBud(callback);
        if (this.i !== undefined)
            callback(this.i);
        if (this.x !== undefined)
            callback(this.x);
        if (this.pendQuery === undefined)
            return;
        const { from } = this.pendQuery;
        const { cols } = from;
        for (let col of cols) {
            let bud = (_a = col.field) === null || _a === void 0 ? void 0 : _a.getBud();
            if (bud === undefined)
                continue;
            callback(bud);
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
        return false;
    }
}
exports.BizPend = BizPend;
BizPend.predefinedId = ['si', 'sx', 's'];
BizPend.predefinedValue = ['value', 'price', 'amount', 'svalue', 'sprice', 'samount',];
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
        this.bizPend = bizPend;
    }
    parser(context) {
        return new parser_1.PPendQuery(this, context);
    }
}
exports.PendQuery = PendQuery;
//# sourceMappingURL=Sheet.js.map