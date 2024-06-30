"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budClassKeysOut = exports.budClassesOut = exports.budClassKeysIn = exports.budClassKeys = exports.budClassesUser = exports.budClasses = exports.budClassesIn = exports.BizBudCheck = exports.BizBudRadio = exports.BizBudOptions = exports.BizBudBin = exports.BizBudIDIO = exports.BizBudIXBase = exports.BizBudID = exports.BizBudIDBase = exports.BizBudDate = exports.BizBudNO = exports.BizBudChar = exports.BinValue = exports.BizBudDec = exports.BizBudInt = exports.BizBudValueWithRange = exports.BizBudAny = exports.BizBudPickable = exports.BizUser = exports.BizBudArr = exports.BizBudValue = exports.SetType = exports.BizBud = exports.BudGroup = exports.BudValueSetType = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
const BizPhraseType_1 = require("./BizPhraseType");
const datatype_1 = require("../datatype");
const field_1 = require("../field");
var BudValueSetType;
(function (BudValueSetType) {
    BudValueSetType[BudValueSetType["equ"] = 1] = "equ";
    BudValueSetType[BudValueSetType["init"] = 2] = "init";
    BudValueSetType[BudValueSetType["show"] = 3] = "show";
})(BudValueSetType || (exports.BudValueSetType = BudValueSetType = {}));
class BudGroup extends Base_1.BizBase {
    constructor(biz, name) {
        super(biz);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.budGroup;
        this.buds = [];
        this.name = name;
    }
    parser(context) {
        return;
    }
    buildSchema(res) {
        if (typeof this.id === 'object')
            debugger;
        let ret = super.buildSchema(res);
        if (this.buds.length > 0) {
            ret.buds = this.buds.map(v => v.id);
        }
        return ret;
    }
}
exports.BudGroup = BudGroup;
class BizBud extends Base_1.BizBase {
    get bizPhraseType() { return BizPhraseType_1.BizPhraseType.bud; }
    get objName() { return undefined; }
    getFieldShows() { return undefined; }
    constructor(entity, name, ui) {
        super(entity === null || entity === void 0 ? void 0 : entity.biz);
        this.flag = Entity_1.BudIndex.none;
        this.entity = entity;
        this.name = name;
        Object.assign(this.ui, ui);
    }
    buildBudValue(expStringify) { }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.dataType = this.dataType;
        ret.value = (_a = this.value) === null || _a === void 0 ? void 0 : _a.str;
        return ret;
    }
    get theEntity() {
        return this.entity;
    }
    createDataType() { return new datatype_1.BigInt(); }
    createField() {
        let ret = new field_1.Field();
        ret.name = this.name;
        ret.dataType = this.createDataType();
        ret.nullable = true;
        return ret;
    }
}
exports.BizBud = BizBud;
var SetType;
(function (SetType) {
    SetType[SetType["assign"] = 0] = "assign";
    SetType[SetType["balance"] = 1] = "balance";
    SetType[SetType["cumulate"] = 2] = "cumulate";
})(SetType || (exports.SetType = SetType = {}));
class BizBudValue extends BizBud {
    get optionsItemType() { return; }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.history = this.hasHistory === true ? true : undefined;
        ret.setType = (_a = this.setType) !== null && _a !== void 0 ? _a : SetType.assign;
        return ret;
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
    buildBudValue(expStringify) {
        if (this.value === undefined)
            return;
        let { exp, setType } = this.value;
        let str = expStringify(exp);
        let typeStr = BudValueSetType[setType];
        str += '\n' + typeStr;
        this.value.str = str;
    }
}
exports.BizBudValue = BizBudValue;
class BizBudArr extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.arr;
        this.canIndex = false;
        this.props = new Map();
    }
    parser(context) {
        return new parser_1.PBizBudArr(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.props.size > 0) {
            let props = [];
            for (let [, value] of this.props) {
                props.push(value.buildSchema(res));
            }
            Object.assign(ret, { props });
        }
        return ret;
    }
    createDataType() { return new datatype_1.JsonDataType(); }
}
exports.BizBudArr = BizBudArr;
class BizUser extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.user;
        this.defaults = [];
    }
    parser(context) {
        return new parser_1.PBizUser(this, context);
    }
    buildPhrases(phrases, prefix) {
        super.buildPhrases(phrases, prefix);
    }
}
exports.BizUser = BizUser;
class BizBudPickable extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.atom;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudPickable(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.pick = this.pick;
        return ret;
    }
}
exports.BizBudPickable = BizBudPickable;
// 有值，但无法确定
class BizBudAny extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.any;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudAny(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizBudAny = BizBudAny;
class BizBudValueWithRange extends BizBudValue {
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.min !== undefined) {
            ret.min = this.min.str;
        }
        if (this.max !== undefined) {
            ret.max = this.max.str;
        }
        return ret;
    }
    buildBudValue(expStringify) {
        super.buildBudValue(expStringify);
        if (this.min !== undefined) {
            this.min.str = expStringify(this.min.exp);
        }
        if (this.max !== undefined) {
            this.max.str = expStringify(this.max.exp);
        }
    }
}
exports.BizBudValueWithRange = BizBudValueWithRange;
class BizBudInt extends BizBudValueWithRange {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.int;
        this.canIndex = true;
    }
    parser(context) {
        return new parser_1.PBizBudInt(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizBudInt = BizBudInt;
class BizBudDec extends BizBudValueWithRange {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.dec;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudDec(this, context);
    }
    createDataType() { return new datatype_1.Dec(18, 6); }
}
exports.BizBudDec = BizBudDec;
class BinValue extends BizBudDec {
    constructor() {
        super(...arguments);
        this.values = [];
    }
    parser(context) {
        return new parser_1.PBinValue(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.values = this.values.map(v => v.buildSchema(res));
        return ret;
    }
    buildBudValue(expStringify) {
        super.buildBudValue(expStringify);
        for (let v of this.values) {
            v.buildBudValue(expStringify);
        }
    }
}
exports.BinValue = BinValue;
class BizBudChar extends BizBudValueWithRange {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.char;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudChar(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
    createDataType() { return new datatype_1.Char(200); }
}
exports.BizBudChar = BizBudChar;
class BizBudNO extends BizBudChar {
    createDataType() { return new datatype_1.Char(30); }
}
exports.BizBudNO = BizBudNO;
class BizBudDate extends BizBudValueWithRange {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.date;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudDate(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizBudDate = BizBudDate;
class BizBudIDBase extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.atom;
        this.canIndex = true;
        this.params = {}; // 仅仅针对Spec，可能有多级的base
    }
    getFieldShows() {
        let ret = [];
        if (this.fieldShows !== undefined)
            ret.push(this.fieldShows);
        const has = (bud) => {
            let { id } = bud;
            for (let arr of ret) {
                for (let fs of arr) {
                    if (fs.length !== 2)
                        return false;
                    if (fs[0].id === this.id && fs[1].id === id)
                        return true;
                }
            }
            return false;
        };
        const push = (buds) => {
            if (buds === undefined)
                return;
            let retBuds = [];
            for (let bud of buds) {
                if (has(bud) === true) {
                    continue;
                }
                retBuds.push([this, bud]);
            }
            ret.push(retBuds);
        };
        if (this.ID !== undefined) {
            // 有些 ID 字段，没有申明类型
            let { titleBuds, primeBuds } = this.ID;
            push(titleBuds);
            push(primeBuds);
        }
        return ret;
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.atom = (_a = this.ID) === null || _a === void 0 ? void 0 : _a.name;
        let hasParams = false;
        let params = {};
        for (let i in this.params) {
            params[i] = this.params[i].str;
            hasParams = true;
        }
        if (hasParams === true) {
            ret.params = params;
        }
        if (this.fieldShows !== undefined) {
            ret.fieldShows = this.fieldShows.map(v => {
                return v.map(i => i.id);
            });
        }
        return ret;
    }
    get objName() { var _a; return (_a = this.ID) === null || _a === void 0 ? void 0 : _a.phrase; }
    buildBudValue(expStringify) {
        super.buildBudValue(expStringify);
        for (let i in this.params) {
            let param = this.params[i];
            let { exp } = param;
            param.str = expStringify(exp);
        }
    }
}
exports.BizBudIDBase = BizBudIDBase;
class BizBudID extends BizBudIDBase {
    constructor() {
        super(...arguments);
        this.isIxBase = false;
    }
    parser(context) {
        return new parser_1.PBizBudID(this, context);
    }
}
exports.BizBudID = BizBudID;
// Base here is I.base or X.base
class BizBudIXBase extends BizBudIDBase {
    constructor() {
        super(...arguments);
        this.isIxBase = true;
    }
    parser(context) {
        return new parser_1.PBizBudIXBase(this, context);
    }
}
exports.BizBudIXBase = BizBudIXBase;
// ID的属性定义，ID表示需要转换
// 后面仅仅可以Atom
class BizBudIDIO extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.ID;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudIDIO(this, context);
    }
}
exports.BizBudIDIO = BizBudIDIO;
class BizBudBin extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.bin;
        this.canIndex = false;
        this.showBuds = [];
    }
    parser(context) {
        return new parser_1.PBizBudBin(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        ret.bin = this.bin.id;
        return ret;
    }
}
exports.BizBudBin = BizBudBin;
class BizBudOptions extends BizBudValue {
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        ret.options = (_a = this.options) === null || _a === void 0 ? void 0 : _a.id;
        return ret;
    }
    get objName() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.phrase; }
}
exports.BizBudOptions = BizBudOptions;
class BizBudRadio extends BizBudOptions {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.radio;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudRadio(this, context);
    }
}
exports.BizBudRadio = BizBudRadio;
class BizBudCheck extends BizBudOptions {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.check;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudCheck(this, context);
    }
}
exports.BizBudCheck = BizBudCheck;
exports.budClassesIn = {
    int: BizBudInt,
    dec: BizBudDec,
    no: BizBudNO,
    char: BizBudChar,
    date: BizBudDate,
    id: BizBudIDIO,
    bin: BizBudBin,
    $arr: BizBudArr,
};
exports.budClasses = Object.assign(Object.assign({}, exports.budClassesIn), { none: BizBudAny, atom: BizBudID, id: BizBudID, radio: BizBudRadio, check: BizBudCheck, binValue: BinValue });
exports.budClassesUser = {
    int: BizBudInt,
    dec: BizBudDec,
    char: BizBudChar,
    date: BizBudDate,
    atom: BizBudID,
    radio: BizBudRadio,
};
exports.budClassKeys = Object.keys(exports.budClasses);
exports.budClassKeysIn = Object.keys(exports.budClassesIn);
exports.budClassesOut = Object.assign({}, exports.budClassesIn);
exports.budClassKeysOut = Object.keys(exports.budClassesOut);
//# sourceMappingURL=Bud.js.map