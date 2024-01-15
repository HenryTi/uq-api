"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budClassKeysOut = exports.budClassesOut = exports.budClassKeysIn = exports.budClassKeys = exports.budClasses = exports.budClassesIn = exports.BizBudCheck = exports.BizBudRadio = exports.BizBudIntOf = exports.BizBudOptions = exports.BizBudID = exports.BizBudIDOut = exports.BizBudIDBase = exports.BizBudDate = exports.BizBudChar = exports.BizBudDec = exports.BizBudInt = exports.BizBudValueWithRange = exports.BizBudNone = exports.BizBudPickable = exports.BizBudValue = exports.SetType = exports.BizBud = exports.BudGroup = exports.FieldShowItem = exports.BudValueSetType = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
const BizPhraseType_1 = require("./BizPhraseType");
var BudValueSetType;
(function (BudValueSetType) {
    BudValueSetType[BudValueSetType["equ"] = 1] = "equ";
    BudValueSetType[BudValueSetType["init"] = 2] = "init";
    BudValueSetType[BudValueSetType["show"] = 3] = "show";
})(BudValueSetType || (exports.BudValueSetType = BudValueSetType = {}));
class FieldShowItem {
    constructor(bizEntity, bizBud) {
        this.bizEntity = bizEntity;
        this.bizBud = bizBud;
    }
    static createEntityFieldShow(entity, bizBud) {
        return new EntityFieldShowItem(entity, bizBud);
    }
    static createBinFieldShow(bizBin, bizBud) {
        return new BinFieldShowItem(bizBin, bizBud);
    }
    static createSpecFieldShow(bizSpec, bizBud) {
        return new SpecFieldShowItem(bizSpec, bizBud);
    }
    static createSpecAtomFieldShow(bizSpec, bizBud) {
        return new SpecAtomFieldShowItem(bizSpec, bizBud);
    }
    static createAtomFieldShow(bizAtom, bizBud) {
        return new AtomFieldShowItem(bizAtom, bizBud);
    }
}
exports.FieldShowItem = FieldShowItem;
class EntityFieldShowItem extends FieldShowItem {
}
class BinFieldShowItem extends FieldShowItem {
}
class SpecFieldShowItem extends FieldShowItem {
}
class SpecAtomFieldShowItem extends FieldShowItem {
}
class AtomFieldShowItem extends FieldShowItem {
}
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
        let ret = super.buildSchema(res);
        if (this.buds.length > 0) {
            ret.buds = this.buds.map(v => v.id);
        }
        return ret;
    }
}
exports.BudGroup = BudGroup;
class BizBud extends Base_1.BizBase {
    get objName() { return undefined; }
    getFieldShows() { return undefined; }
    constructor(biz, name, ui) {
        super(biz);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.bud;
        this.flag = Entity_1.BudIndex.none;
        this.name = name;
        this.ui = ui;
    }
    buildBudValue(expStringify) { }
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
        var _a, _b;
        let ret = super.buildSchema(res);
        return {
            ...ret,
            dataType: this.dataType,
            value: (_a = this.value) === null || _a === void 0 ? void 0 : _a.str,
            history: this.hasHistory === true ? true : undefined,
            setType: (_b = this.setType) !== null && _b !== void 0 ? _b : SetType.assign,
            // show: this.show,
        };
    }
    buildPhrases(phrases, prefix) {
        if (this.name === 'item')
            debugger;
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
class BizBudNone extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.none;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudNone(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizBudNone = BizBudNone;
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
}
exports.BizBudDec = BizBudDec;
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
}
exports.BizBudChar = BizBudChar;
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
class BizBudIDBase extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.none;
    }
    parser(context) {
        return new parser_1.PBizBudIDBase(this, context);
    }
}
exports.BizBudIDBase = BizBudIDBase;
// 仅仅Out的属性定义，ID表示需要转换
class BizBudIDOut extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.ID;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudIDOut(this, context);
    }
}
exports.BizBudIDOut = BizBudIDOut;
class BizBudID extends BizBudValue {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.atom;
        this.canIndex = true;
        this.params = {}; // 仅仅针对Spec，可能有多级的base
    }
    getFieldShows() { return this.fieldShows; }
    parser(context) {
        return new parser_1.PBizBudID(this, context);
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
        if (hasParams === true)
            ret.params = params;
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
exports.BizBudID = BizBudID;
class BizBudOptions extends BizBudValue {
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return {
            ...ret, options: (_a = this.options) === null || _a === void 0 ? void 0 : _a.phrase
        };
    }
    get objName() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.phrase; }
}
exports.BizBudOptions = BizBudOptions;
class BizBudIntOf extends BizBudOptions {
    constructor() {
        super(...arguments);
        this.dataType = BizPhraseType_1.BudDataType.intof;
        this.canIndex = true;
    }
    parser(context) {
        return new parser_1.PBizBudIntOf(this, context);
    }
}
exports.BizBudIntOf = BizBudIntOf;
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
    char: BizBudChar,
    date: BizBudDate,
};
exports.budClasses = {
    ...exports.budClassesIn,
    none: BizBudNone,
    atom: BizBudID,
    intof: BizBudIntOf,
    radio: BizBudRadio,
    check: BizBudCheck,
};
exports.budClassKeys = Object.keys(exports.budClasses);
exports.budClassKeysIn = Object.keys(exports.budClassesIn);
exports.budClassesOut = {
    ...exports.budClassesIn,
    id: BizBudIDOut,
};
exports.budClassKeysOut = Object.keys(exports.budClassesOut);
//# sourceMappingURL=Bud.js.map