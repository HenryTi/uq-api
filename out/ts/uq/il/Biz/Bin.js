"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBinAct = exports.BizBin = exports.BinPivot = exports.BinDiv = exports.BinInputAtom = exports.BinInputSpec = exports.BinInput = exports.PickPend = exports.PickSpec = exports.PickAtom = exports.PickQuery = exports.BinPick = exports.PickParam = void 0;
const builder_1 = require("../../builder");
const parser_1 = require("../../parser");
const EnumSysTable_1 = require("../EnumSysTable");
const Base_1 = require("./Base");
const Bud_1 = require("./Bud");
const Entity_1 = require("./Entity");
const BizPhraseType_1 = require("./BizPhraseType");
const consts_1 = require("../../consts");
class PickParam extends Bud_1.BizBudValue {
    constructor() {
        super(...arguments);
        this.canIndex = false;
        this.dataType = BizPhraseType_1.BudDataType.none;
    }
    parser(context) {
        return new parser_1.PPickParam(this, context);
    }
    // name: string;
    // bud: string;
    // prop: string;       // prop of bud
    // valueSet: BudValueSet;
    buildSchema(res) {
        return super.buildSchema(res);
    }
}
exports.PickParam = PickParam;
class BinPick extends Bud_1.BizBud {
    constructor(bin, name, ui) {
        super(bin, name, ui);
        this.dataType = BizPhraseType_1.BudDataType.none;
        this.bin = bin;
    }
    parser(context) {
        return new parser_1.PBinPick(this, context);
    }
    buildBudValue(expStringify) {
        if (this.params === undefined)
            return;
        for (let param of this.params) {
            param.buildBudValue(expStringify);
        }
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
    getBud(name) { return; }
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
        // 不支持atom的其它字段属性。只能用查询
        return ['id', 'no', 'ex'].includes(prop);
    }
    getBud(name) { return; }
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
    getBud(name) { return; }
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
    getBud(name) { return this.from.getBud(name); }
}
exports.PickPend = PickPend;
class BinInput extends Bud_1.BizBud {
    constructor(bin, name, ui) {
        super(bin, name, ui);
        this.dataType = BizPhraseType_1.BudDataType.none;
        this.bin = bin;
    }
}
exports.BinInput = BinInput;
class BinInputSpec extends BinInput {
    parser(context) {
        return new parser_1.PBinInputSpec(this, context);
    }
    buildBudValue(expStringify) {
        super.buildBudValue(expStringify);
        this.baseValueStr = expStringify(this.baseValue);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.spec = this.spec.id;
        /*
        if (this.baseBud !== undefined) {
            ret.base = this.baseBud.id;
        }
        else {
        */
        ret.base = this.baseValueStr;
        // }
        return ret;
    }
}
exports.BinInputSpec = BinInputSpec;
class BinInputAtom extends BinInput {
    parser(context) {
        return new parser_1.PBinInputAtom(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.atom = this.atom.id;
        return ret;
    }
}
exports.BinInputAtom = BinInputAtom;
// column: maybe I, Value, Amount, Price, I.base, I.base.base, Prop
class BinDiv {
    constructor(parent, ui) {
        this.fields = [];
        this.buds = [];
        this.inputs = [];
        this.ui = ui;
        if (parent !== undefined) {
            parent.div = this;
            this.parent = parent;
        }
        this.level = this.parent === undefined ? 1 : this.parent.level + 1;
    }
    buildSchema(res) {
        let inputs = [];
        if (this.inputs !== undefined) {
            for (let input of this.inputs) {
                let schema = input.buildSchema(res);
                inputs.push(schema);
            }
        }
        if (inputs.length === 0)
            inputs = undefined;
        let ret = {
            ui: this.ui,
            buds: this.buds.map(v => v.name),
            div: this.div?.buildSchema(res),
            inputs,
        };
        return ret;
    }
}
exports.BinDiv = BinDiv;
class BinPivot extends BinDiv {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.key = this.key.id;
        if (this.format !== undefined) {
            ret.format = this.format.map(([bud, withLabel, exclude]) => {
                return [bud.id, withLabel === true ? 1 : 0, exclude?.id];
            });
        }
        return ret;
    }
}
exports.BinPivot = BinPivot;
class BizBin extends Entity_1.BizEntity {
    constructor(biz) {
        super(biz);
        this.fields = ['id', 'pend', ...consts_1.binFieldArr];
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.bin;
        this.pickColl = {};
        this.inputColl = {};
        this.sheetArr = []; // 被多少sheet引用了
        this.outs = {};
        this.predefinedBuds = {};
        this.div = new BinDiv(undefined, undefined); // 输入和显示的层级结构
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
    setInput(input) {
        if (this.inputArr === undefined) {
            this.inputArr = [];
        }
        this.inputArr.push(input);
        this.inputColl[input.name] = input;
    }
    buildPredefinedBuds() {
        [this.i, this.iBase, this.x, this.xBase, this.price, this.amount, this.value].forEach(v => {
            if (v === undefined)
                return;
            this.predefinedBuds[v.name] = v;
            // this.predefinedBuds[v.id] = v;
        });
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        let picks = [];
        if (this.pickArr !== undefined) {
            for (let value of this.pickArr) {
                const { name, ui, pick, params, single, hiddenBuds } = value;
                let from;
                if (pick !== undefined) {
                    from = pick.fromSchema();
                }
                picks.push({
                    name,
                    ui,
                    from,
                    hidden: hiddenBuds?.map(v => v.id),
                    params: params?.map(v => v.buildSchema(res)),
                    single,
                });
            }
        }
        ;
        let inputs = [];
        if (this.inputArr !== undefined) {
            for (let input of this.inputArr) {
                let schema = input.buildSchema(res);
                inputs.push(schema);
            }
        }
        let price = this.price?.buildSchema(res);
        let pivot;
        if (this.pivot !== undefined)
            pivot = true;
        this.schema = {
            ...ret,
            main: this.main?.id,
            picks: picks.length === 0 ? undefined : picks,
            inputs: inputs.length === 0 ? undefined : inputs,
            pend: this.pend?.id,
            i: this.i?.buildSchema(res),
            iBase: this.iBase?.buildSchema(res),
            x: this.x?.buildSchema(res),
            xBase: this.xBase?.buildSchema(res),
            value: this.value?.buildSchema(res),
            amount: this.amount?.buildSchema(res),
            price,
            div: this.div.buildSchema(res),
            pivot,
        };
        return this.schema;
    }
    getSheetBud(name) {
        for (let sheet of this.sheetArr) {
            let { main } = sheet;
            if (main === undefined)
                continue;
            let bud = main.getBud(name);
            if (bud !== undefined)
                return bud;
        }
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.pickArr !== undefined) {
            for (let pick of this.pickArr)
                callback(pick);
        }
        if (this.inputArr !== undefined) {
            for (let input of this.inputArr)
                callback(input);
        }
        for (let i in this.predefinedBuds) {
            callback(this.predefinedBuds[i]);
        }
        // this.predefinedBuds.forEach(v => callback(v));
    }
    getBud(name) {
        let bud = super.getBud(name);
        if (bud !== undefined)
            return bud;
        bud = this.predefinedBuds[name];
        return bud;
    }
    db(dbContext) {
        return new builder_1.BBizBin(dbContext, this);
    }
    getDivFromBud(bud) {
        for (let p = this.div; p !== undefined; p = p.div) {
            let b = p.buds.find(v => v.name === bud.name);
            if (b !== undefined) {
                if (b !== bud)
                    debugger;
                return p;
            }
        }
        return undefined;
    }
    checkUserDefault(prop) {
        for (let sheet of this.sheetArr) {
            if (sheet.checkUserDefault(prop) === true) {
                return true;
            }
        }
        return false;
    }
}
exports.BizBin = BizBin;
class BizBinAct extends Base_1.BizAct {
    constructor(biz, bizBin) {
        super(biz);
        this.bizBin = bizBin;
    }
    get spaceEntity() { return this.bizBin; }
    parser(context) {
        return new parser_1.PBizBinAct(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return {
            ...ret,
            bin: this.bizBin.name,
        };
    }
}
exports.BizBinAct = BizBinAct;
//# sourceMappingURL=Bin.js.map