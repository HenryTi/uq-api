"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBase = exports.BudDataType = exports.BizPhraseType = void 0;
const element_1 = require("../element");
var BizPhraseType;
(function (BizPhraseType) {
    BizPhraseType[BizPhraseType["atom"] = 11] = "atom";
    BizPhraseType[BizPhraseType["uom"] = 12] = "uom";
    BizPhraseType[BizPhraseType["spec"] = 13] = "spec";
    BizPhraseType[BizPhraseType["sheet"] = 101] = "sheet";
    BizPhraseType[BizPhraseType["role"] = 201] = "role";
    BizPhraseType[BizPhraseType["permit"] = 202] = "permit";
    BizPhraseType[BizPhraseType["with"] = 151] = "with";
    BizPhraseType[BizPhraseType["key"] = 1001] = "key";
    BizPhraseType[BizPhraseType["prop"] = 1011] = "prop";
    BizPhraseType[BizPhraseType["assign"] = 1021] = "assign";
})(BizPhraseType = exports.BizPhraseType || (exports.BizPhraseType = {}));
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
    get basePhrase() { return ''; }
    buildPhrase(prefix) {
        this.phrase = `${prefix}.${this.name}`;
    }
    buildPhrases(phrases, prefix) {
        var _a;
        this.buildPhrase(prefix);
        phrases.push([this.phrase, (_a = this.caption) !== null && _a !== void 0 ? _a : '', this.basePhrase, this.getTypeNum()]);
    }
    getTypeNum() {
        var _a;
        let n = (_a = BizPhraseType[this.type]) !== null && _a !== void 0 ? _a : 0;
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