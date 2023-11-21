"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinAct = exports.BizBin = exports.PickInput = exports.PickPend = exports.PickSpec = exports.PickAtom = exports.PickQuery = exports.BinPick = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const EnumSysTable_1 = require("../EnumSysTable");
const IElement_1 = require("../IElement");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
const BizPhraseType_1 = require("./BizPhraseType");
class BinPick extends Bud_1.BizBud {
    constructor(bin, name, ui) {
        super(bin.biz, name, ui);
        this.dataType = BizPhraseType_1.BudDataType.none;
        this.bin = bin;
    }
    parser(context) {
        return new parser_1.PBinPick(this, context);
    }
}
exports.BinPick = BinPick;
class PickQuery {
    constructor(query) {
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
class PickAtom {
    constructor(from) {
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
class PickSpec {
    constructor(from) {
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
class PickPend {
    constructor(from) {
        this.bizEntityTable = EnumSysTable_1.EnumSysTable.pend;
        this.from = from;
    }
    fromSchema() { return [this.from.name]; }
    hasParam(param) {
        let { params } = this.from.pendQuery;
        return params.findIndex(v => v.name === param) >= 0;
    }
    hasReturn(prop) {
        if (prop === undefined || prop === 'id')
            return true;
        return this.from.hasField(prop);
    }
}
exports.PickPend = PickPend;
class PickInput extends IElement_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'pickinput';
        this.bizEntityTable = undefined;
    }
    fromSchema() {
        return [];
    }
    hasParam(param) {
        return true;
    }
    hasReturn(prop) {
        return true;
    }
    parser(context) {
        return new parser_1.PPickInput(this, context);
    }
}
exports.PickInput = PickInput;
class BizBin extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.fields = ['id', 'i', 'x', 'pend', 'value', 'price', 'amount'];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.bin;
        this.pickColl = {};
        this.sheetArr = [];
    }
    parser(context) {
        return new parser_1.PBizBin(this, context);
    }
    setPick(pick) {
        if (this.pickArr === undefined) {
            this.pickArr = [];
        }
        this.pickArr.push(pick);
        this.pickColl[pick.name] = pick;
    }
    buildSchema(res) {
        var _a, _b, _c, _d, _e, _f;
        let ret = super.buildSchema(res);
        let picks = [];
        if (this.pickArr !== undefined) {
            for (let value of this.pickArr) {
                const { name, ui, pick, params, single } = value;
                picks.push({
                    name,
                    ui,
                    from: pick.fromSchema(),
                    params,
                    single,
                });
            }
        }
        ;
        let price = (_a = this.price) === null || _a === void 0 ? void 0 : _a.buildSchema(res);
        this.schema = Object.assign(Object.assign({}, ret), { picks: picks.length === 0 ? undefined : picks, pend: (_b = this.pend) === null || _b === void 0 ? void 0 : _b.id, i: (_c = this.i) === null || _c === void 0 ? void 0 : _c.buildSchema(res), x: (_d = this.x) === null || _d === void 0 ? void 0 : _d.buildSchema(res), value: (_e = this.value) === null || _e === void 0 ? void 0 : _e.buildSchema(res), amount: (_f = this.amount) === null || _f === void 0 ? void 0 : _f.buildSchema(res), price });
        return this.schema;
    }
    getSheetProps() {
        let budArr = [];
        for (let sheet of this.sheetArr) {
            let { main } = sheet;
            if (main === undefined)
                continue;
            for (let [, bud] of main.props) {
                budArr.push(bud);
            }
        }
        return budArr;
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.pickArr !== undefined) {
            for (let pick of this.pickArr)
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
        if (this.i !== undefined) {
            if (this.i.name === 'i')
                return this.i;
        }
        if (this.x !== undefined) {
            if (this.x.name === 'x')
                return this.x;
        }
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
        let pick = this.pickColl[pickName];
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
                case BizPhraseType_1.BudDataType.atom: break;
            }
            let { atom } = b;
            bizEntity = atom;
        }
        return bizEntity;
    }
}
exports.BizBin = BizBin;
class BizBinAct extends Base_1.BizBase {
    constructor(biz, bizBin) {
        super(biz);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.detailAct;
        this.tableVars = {};
        this.bizBin = bizBin;
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
        return Object.assign(Object.assign({}, ret), { detail: this.bizBin.name });
    }
}
exports.BizBinAct = BizBinAct;
//# sourceMappingURL=Bin.js.map