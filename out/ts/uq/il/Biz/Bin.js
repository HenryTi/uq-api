"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinAct = exports.BizBin = exports.PickPend = exports.PickSpec = exports.PickAtom = exports.PickQuery = exports.PickBase = exports.BinPick = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const EnumSysTable_1 = require("../EnumSysTable");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
class BinPick extends Bud_1.BizBud {
    constructor(bin, name, ui) {
        super(bin.biz, name, ui);
        this.dataType = Base_1.BudDataType.none;
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
        if (prop === undefined || prop === 'id')
            return true;
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
        if (prop === undefined)
            return true;
        // || prop === 'id') return true;
        /*
        for (let atom of this.from) {
            let bud = atom.getBud(prop);
            if (bud !== undefined) return true;
        }
        */
        // 不支持atom的其它字段属性。只能用查询
        return ['id', 'no', 'ex'].includes(prop);
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
        if (prop === undefined || prop === 'id')
            return true;
        let bud = this.from.getBud(prop);
        if (bud !== undefined)
            return true;
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
        if (prop === undefined || prop === 'id')
            return true;
        return this.from.hasField(prop);
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
            let { ui, name } = this.pend;
            pend = {
                ui,
                entity: name,
                // search,
            };
        }
        let picks = [];
        if (this.picks !== undefined) {
            for (let [, value] of this.picks) {
                const { name, ui, pick, param, single } = value;
                picks.push({
                    name,
                    ui,
                    from: pick.fromSchema(),
                    param,
                    single,
                });
            }
        }
        ;
        let price = (_a = this.price) === null || _a === void 0 ? void 0 : _a.buildSchema(res);
        this.schema = Object.assign(Object.assign({}, ret), { picks: picks.length === 0 ? undefined : picks, pend, i: (_b = this.i) === null || _b === void 0 ? void 0 : _b.buildSchema(res), x: (_c = this.x) === null || _c === void 0 ? void 0 : _c.buildSchema(res), value: (_d = this.value) === null || _d === void 0 ? void 0 : _d.buildSchema(res), amount: (_e = this.amount) === null || _e === void 0 ? void 0 : _e.buildSchema(res), price });
        return this.schema;
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.picks !== undefined) {
            for (let [, pick] of this.picks)
                callback(pick);
        }
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
    getPick(pickName) {
        if (this.picks === undefined)
            return;
        let pick = this.picks.get(pickName);
        return pick;
    }
    getBinBudEntity(bud) {
        let bizEntity;
        if (bud === 'i') {
            if (this.i === undefined)
                return;
            bizEntity = this.i.atom;
        }
        else if (bud === 'x') {
            if (this.x === undefined)
                return;
            bizEntity = this.x.atom;
        }
        else {
            let b = this.getBud(bud);
            if (b === undefined)
                return;
            switch (b.dataType) {
                default: return;
                case Base_1.BudDataType.atom: break;
            }
            let { atom } = b;
            bizEntity = atom;
        }
        return bizEntity;
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
        return new parser_1.PBizBinAct(this, context);
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