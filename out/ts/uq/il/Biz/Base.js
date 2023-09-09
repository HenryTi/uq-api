"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBase = exports.BudDataType = exports.BizMonikerType = void 0;
const element_1 = require("../element");
var BizMonikerType;
(function (BizMonikerType) {
    BizMonikerType[BizMonikerType["atom"] = 11] = "atom";
    BizMonikerType[BizMonikerType["uom"] = 12] = "uom";
    BizMonikerType[BizMonikerType["spec"] = 13] = "spec";
    BizMonikerType[BizMonikerType["sheet"] = 101] = "sheet";
    BizMonikerType[BizMonikerType["role"] = 201] = "role";
    BizMonikerType[BizMonikerType["permit"] = 202] = "permit";
    BizMonikerType[BizMonikerType["with"] = 151] = "with";
    BizMonikerType[BizMonikerType["key"] = 1001] = "key";
    BizMonikerType[BizMonikerType["prop"] = 1011] = "prop";
    BizMonikerType[BizMonikerType["assign"] = 1021] = "assign";
})(BizMonikerType = exports.BizMonikerType || (exports.BizMonikerType = {}));
;
var BudDataType;
(function (BudDataType) {
    BudDataType[BudDataType["none"] = 0] = "none";
    BudDataType[BudDataType["int"] = 11] = "int";
    BudDataType[BudDataType["atom"] = 12] = "atom";
    BudDataType[BudDataType["radio"] = 13] = "radio";
    BudDataType[BudDataType["check"] = 14] = "check";
    BudDataType[BudDataType["ID"] = 19] = "ID";
    BudDataType[BudDataType["dec"] = 21] = "dec";
    BudDataType[BudDataType["char"] = 31] = "char";
    BudDataType[BudDataType["str"] = 32] = "str";
    BudDataType[BudDataType["date"] = 41] = "date";
})(BudDataType = exports.BudDataType || (exports.BudDataType = {}));
;
class BizBase extends element_1.IElement {
    setJName(jName) {
        if (jName === undefined)
            return;
        if (jName === this.name)
            return;
        this.jName = jName;
    }
    buildSchema() {
        return {
            name: this.name,
            jName: this.jName,
            type: this.type,
            caption: this.caption,
        };
    }
    ;
    checkName(name) {
        return true;
    }
    get nameDotType() {
        return `${this.type}.${this.name}`;
    }
    get basePhrase() { return ''; }
    buildPhrases(phrases, prefix) {
        var _a;
        let phrase = `${prefix}.${this.name}`;
        phrases.push([phrase, (_a = this.caption) !== null && _a !== void 0 ? _a : '', this.basePhrase, this.getTypeNum()]);
        this.phrase = phrase;
    }
    getTypeNum() {
        var _a;
        let n = (_a = BizMonikerType[this.type]) !== null && _a !== void 0 ? _a : 0;
        return String(n);
    }
    getBizBase(bizName) {
        let len = bizName.length;
        let ret;
        let [n0] = bizName;
        if (this.name !== n0) {
            ret = this.getBizBase1(n0);
            if (ret === undefined)
                return;
        }
        else {
            ret = this;
        }
        for (let i = 1; i < len; i++) {
            ret = ret.getBizBase1(bizName[i]);
            if (ret === undefined)
                break;
        }
        return ret;
    }
    getBizBase1(bizName) {
        return;
        // if (this.name === bizName) return this;
    }
}
exports.BizBase = BizBase;
//# sourceMappingURL=Base.js.map