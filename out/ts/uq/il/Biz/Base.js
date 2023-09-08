"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBase = exports.EnumBizType = void 0;
const element_1 = require("../element");
var EnumBizType;
(function (EnumBizType) {
    EnumBizType[EnumBizType["atom"] = 1] = "atom";
    EnumBizType[EnumBizType["sheet"] = 2] = "sheet";
    EnumBizType[EnumBizType["key"] = 11] = "key";
    EnumBizType[EnumBizType["prop"] = 12] = "prop";
    EnumBizType[EnumBizType["assign"] = 13] = "assign";
    EnumBizType[EnumBizType["permit"] = 14] = "permit";
    EnumBizType[EnumBizType["with"] = 15] = "with";
    EnumBizType[EnumBizType["role"] = 16] = "role";
})(EnumBizType = exports.EnumBizType || (exports.EnumBizType = {}));
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
    buildPhrases(phrases, prefix) {
        var _a;
        let phrase = `${prefix}.${this.name}`;
        phrases.push([phrase, (_a = this.caption) !== null && _a !== void 0 ? _a : '', this.basePhrase, this.getTypeNum()]);
        this.phrase = phrase;
    }
    getTypeNum() {
        var _a;
        let n = (_a = EnumBizType[this.type]) !== null && _a !== void 0 ? _a : 0;
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