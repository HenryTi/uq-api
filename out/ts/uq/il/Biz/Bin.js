"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinAct = exports.BizBin = exports.PickPend = exports.PickSpec = exports.PickAtom = exports.PickQuery = exports.PickBase = exports.BinPick = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const EnumSysTable_1 = require("../EnumSysTable");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BinPick extends Base_1.BizBase {
    constructor(bin) {
        super(bin.biz);
        this.bizPhraseType = Base_1.BizPhraseType.pick;
        this.bin = bin;
    }
    parser(context) {
        return new parser_1.PBinPick(this, context);
    }
}
exports.BinPick = BinPick;
class PickBase {
}
exports.PickBase = PickBase;
class PickQuery extends PickBase {
    constructor(query) {
        super();
        this.bizEntityTable = undefined;
        this.query = query;
    }
    fromSchema() { return [this.query.name]; }
    hasParam(param) {
        return this.query.hasParam(param);
    }
    hasReturn(prop) {
        return this.query.hasReturn(prop);
    }
}
exports.PickQuery = PickQuery;
class PickAtom extends PickBase {
    constructor(from) {
        super();
        this.bizEntityTable = EnumSysTable_1.EnumSysTable.atom;
        this.from = from;
    }
    fromSchema() { return this.from.map(v => v.name); }
    hasParam(param) {
        return false;
    }
    hasReturn(prop) {
        return false;
    }
}
exports.PickAtom = PickAtom;
class PickSpec extends PickBase {
    constructor(from) {
        super();
        this.bizEntityTable = EnumSysTable_1.EnumSysTable.spec;
        this.from = from;
    }
    fromSchema() { return [this.from.name]; }
    hasParam(param) {
        return param === 'base';
    }
    hasReturn(prop) {
        return false;
    }
}
exports.PickSpec = PickSpec;
class PickPend extends PickBase {
    constructor(from) {
        super();
        this.bizEntityTable = EnumSysTable_1.EnumSysTable.pend;
        this.from = from;
    }
    fromSchema() { return [this.from.name]; }
    hasParam(param) {
        return false;
    }
    hasReturn(prop) {
        return false;
    }
}
exports.PickPend = PickPend;
class BizBin extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = ['id', 'i', 'x', 'pend', 'value', 'price', 'amount'];
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
            let { caption, entity, search } = this.pend;
            pend = {
                caption,
                entity: entity.name,
                search,
            };
        }
        let picks = [];
        if (this.picks !== undefined) {
            for (let [, value] of this.picks) {
                const { name, pick, param } = value;
                picks.push({
                    name,
                    from: pick.fromSchema(),
                    param,
                });
            }
        }
        ;
        return Object.assign(Object.assign({}, ret), { picks: picks.length === 0 ? undefined : picks, pend, i: (_a = this.i) === null || _a === void 0 ? void 0 : _a.buildSchema(res), x: (_b = this.x) === null || _b === void 0 ? void 0 : _b.buildSchema(res), value: (_c = this.value) === null || _c === void 0 ? void 0 : _c.buildSchema(res), amount: (_d = this.amount) === null || _d === void 0 ? void 0 : _d.buildSchema(res), price: (_e = this.price) === null || _e === void 0 ? void 0 : _e.buildSchema(res) });
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
        return new builder_1.BBizBin(dbContext, this);
    }
    isValidPickProp(pickName, prop) {
        let pick = this.picks.get(pickName);
        if (pick === undefined)
            return false;
        if (prop === undefined)
            return true;
        return pick.pick.hasReturn(prop);
    }
}
exports.BizBin = BizBin;
class BizBinAct extends Base_1.BizBase {
    constructor(biz, bizDetail) {
        super(biz);
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
        return Object.assign(Object.assign({}, ret), { detail: this.bizDetail.name });
    }
}
exports.BizBinAct = BizBinAct;
//# sourceMappingURL=Bin.js.map