"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBudCheck = exports.BizBudRadio = exports.BizBudIntOf = exports.BizBudOptions = exports.BizBudAtom = exports.BizBudDate = exports.BizBudChar = exports.BizBudDec = exports.BizBudInt = exports.BizBudNone = exports.BizBud = exports.BudValueAct = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
var BudValueAct;
(function (BudValueAct) {
    BudValueAct[BudValueAct["equ"] = 1] = "equ";
    BudValueAct[BudValueAct["init"] = 2] = "init";
})(BudValueAct = exports.BudValueAct || (exports.BudValueAct = {}));
class BizBud extends Base_1.BizBase {
    get objName() { return undefined; }
    get optionsItemType() { return; }
    constructor(name, caption) {
        super();
        this.bizPhraseType = Base_1.BizPhraseType.prop;
        this.flag = Entity_1.BudFlag.none;
        this.name = name;
        this.caption = caption;
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { dataType: this.dataType, value: (_a = this.value) === null || _a === void 0 ? void 0 : _a.str, history: this.hasHistory === true ? true : undefined });
    }
    buildPhrases(phrases, prefix) {
        if (this.name === 'item')
            debugger;
        super.buildPhrases(phrases, prefix);
    }
}
exports.BizBud = BizBud;
class BizBudNone extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.none;
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
class BizBudInt extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.int;
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
class BizBudDec extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.dec;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudDec(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return ret;
    }
}
exports.BizBudDec = BizBudDec;
class BizBudChar extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.char;
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
class BizBudDate extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.date;
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
class BizBudAtom extends BizBud {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.atom;
        this.canIndex = true;
    }
    parser(context) {
        return new parser_1.PBizBudAtom(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { atom: (_a = this.atom) === null || _a === void 0 ? void 0 : _a.name });
    }
    get objName() { var _a; return (_a = this.atom) === null || _a === void 0 ? void 0 : _a.phrase; }
}
exports.BizBudAtom = BizBudAtom;
/*
export interface BizSubItem {
    id: number;
    name: string;
    caption: string;
    value: number | string;
}
*/
class BizBudOptions extends BizBud {
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { options: (_a = this.options) === null || _a === void 0 ? void 0 : _a.phrase });
    }
    get objName() { var _a; return (_a = this.options) === null || _a === void 0 ? void 0 : _a.phrase; }
}
exports.BizBudOptions = BizBudOptions;
class BizBudIntOf extends BizBudOptions {
    constructor() {
        super(...arguments);
        this.dataType = Base_1.BudDataType.intof;
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
        this.dataType = Base_1.BudDataType.radio;
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
        this.dataType = Base_1.BudDataType.check;
        this.canIndex = false;
    }
    parser(context) {
        return new parser_1.PBizBudCheck(this, context);
    }
}
exports.BizBudCheck = BizBudCheck;
//# sourceMappingURL=Bud.js.map