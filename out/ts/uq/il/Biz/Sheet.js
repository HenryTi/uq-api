"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinAct = exports.BizPend = exports.BizBin = exports.BizSheet = void 0;
const builder_1 = require("../../builder");
const builder_2 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.sheet;
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
                const { detail, caption } = v;
                return {
                    detail: detail.name,
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
class BizBin extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.bin;
    }
    parser(context) {
        return new parser_1.PBizBin(this, context);
    }
    buildSchema(res) {
        var _a, _b, _c, _d, _e;
        let ret = super.buildSchema(res);
        let pend;
        if (this.pend !== undefined) {
            let { caption, entity } = this.pend;
            pend = {
                caption,
                entity: entity.name
            };
        }
        return Object.assign(Object.assign({}, ret), { pend, i: (_a = this.i) === null || _a === void 0 ? void 0 : _a.buildSchema(res), x: (_b = this.x) === null || _b === void 0 ? void 0 : _b.buildSchema(res), value: (_c = this.value) === null || _c === void 0 ? void 0 : _c.buildSchema(res), amount: (_d = this.amount) === null || _d === void 0 ? void 0 : _d.buildSchema(res), price: (_e = this.price) === null || _e === void 0 ? void 0 : _e.buildSchema(res) });
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.i !== undefined)
            callback(this.i);
        if (this.x !== undefined)
            callback(this.x);
        if (this.value !== undefined)
            callback(this.value);
        if (this.price !== undefined)
            callback(this.price);
        if (this.amount !== undefined)
            callback(this.amount);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        if (this.value !== undefined) {
            if (this.value.name === name)
                return this.value;
        }
        if (this.price !== undefined) {
            if (this.price.name === name)
                return this.price;
        }
        if (this.amount !== undefined) {
            if (this.amount.name === name)
                return this.amount;
        }
        return undefined;
    }
    db(dbContext) {
        return new builder_2.BBizBin(dbContext, this);
    }
}
exports.BizBin = BizBin;
class BizPend extends Entity_1.BizEntity {
    constructor(biz) {
        super(biz);
        this.bizPhraseType = Base_1.BizPhraseType.pend;
        this.predefinedBuds = {};
        for (let n of BizPend.predefinedId) {
            this.predefinedBuds[n] = new Bud_1.BizBudAtom(n, undefined);
        }
        for (let n of BizPend.predefinedValue) {
            this.predefinedBuds[n] = new Bud_1.BizBudDec(n, undefined);
        }
    }
    parser(context) {
        return new parser_1.PBizPend(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud === undefined) {
            bud = this.predefinedBuds[name];
        }
        return bud;
    }
}
BizPend.predefinedId = ['i', 'x', 'si', 'sx', 's'];
BizPend.predefinedValue = ['value', 'price', 'amount', 'svalue', 'sprice', 'samount',];
exports.BizPend = BizPend;
class BizBinAct extends Base_1.BizBase {
    // fromPend: BizPend;
    constructor(bizDetail) {
        super();
        this.bizPhraseType = Base_1.BizPhraseType.detailAct;
        this.tableVars = {};
        this.bizDetail = bizDetail;
    }
    parser(context) {
        return new parser_1.PBizDetailAct(this, context);
    }
    addTableVar(tableVar) {
        let name = tableVar.name;
        let t = this.tableVars[name];
        if (t !== undefined)
            return false;
        this.tableVars[name] = tableVar;
        return true;
    }
    getTableVar(name) { return this.tableVars[name]; }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { 
            // fromPend: this.fromPend?.name,
            detail: this.bizDetail.name });
    }
}
exports.BizBinAct = BizBinAct;
//# sourceMappingURL=Sheet.js.map