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
        let params;
        if (this.pendQuery !== undefined) {
            params = [];
            let { params: queryParams } = this.pendQuery;
            for (let p of queryParams) {
                params.push(p.buildSchema(res));
            }
        }
        ret.params = params;
        return ret;
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }
}
exports.BizPend = BizPend;
BizPend.predefinedId = ['i', 'x', 'si', 'sx', 's'];
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