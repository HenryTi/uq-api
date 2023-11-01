"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizBase = exports.BudDataType = exports.BizPhraseType = void 0;
const element_1 = require("../element");
var BizPhraseType;
(function (BizPhraseType) {
    BizPhraseType[BizPhraseType["any"] = 0] = "any";
    BizPhraseType[BizPhraseType["atom"] = 11] = "atom";
    BizPhraseType[BizPhraseType["spec"] = 12] = "spec";
    BizPhraseType[BizPhraseType["bud"] = 13] = "bud";
    BizPhraseType[BizPhraseType["card"] = 61] = "card";
    BizPhraseType[BizPhraseType["cardDetail"] = 63] = "cardDetail";
    BizPhraseType[BizPhraseType["cardState"] = 62] = "cardState";
    BizPhraseType[BizPhraseType["sheet"] = 101] = "sheet";
    BizPhraseType[BizPhraseType["bin"] = 102] = "bin";
    BizPhraseType[BizPhraseType["pend"] = 104] = "pend";
    BizPhraseType[BizPhraseType["detailAct"] = 111] = "detailAct";
    BizPhraseType[BizPhraseType["query"] = 151] = "query";
    BizPhraseType[BizPhraseType["pick"] = 161] = "pick";
    BizPhraseType[BizPhraseType["role"] = 201] = "role";
    BizPhraseType[BizPhraseType["permit"] = 202] = "permit";
    BizPhraseType[BizPhraseType["options"] = 301] = "options";
    BizPhraseType[BizPhraseType["tree"] = 401] = "tree";
    BizPhraseType[BizPhraseType["tie"] = 501] = "tie";
    BizPhraseType[BizPhraseType["report"] = 601] = "report";
    BizPhraseType[BizPhraseType["title"] = 901] = "title";
    BizPhraseType[BizPhraseType["assign"] = 902] = "assign";
    BizPhraseType[BizPhraseType["key"] = 1001] = "key";
    BizPhraseType[BizPhraseType["prop"] = 1011] = "prop";
    BizPhraseType[BizPhraseType["optionsitem"] = 1031] = "optionsitem";
})(BizPhraseType || (exports.BizPhraseType = BizPhraseType = {}));
;
var BudDataType;
(function (BudDataType) {
    BudDataType[BudDataType["none"] = 0] = "none";
    BudDataType[BudDataType["int"] = 11] = "int";
    BudDataType[BudDataType["atom"] = 12] = "atom";
    BudDataType[BudDataType["radio"] = 13] = "radio";
    BudDataType[BudDataType["check"] = 14] = "check";
    BudDataType[BudDataType["intof"] = 15] = "intof";
    BudDataType[BudDataType["ID"] = 19] = "ID";
    BudDataType[BudDataType["dec"] = 21] = "dec";
    BudDataType[BudDataType["char"] = 31] = "char";
    BudDataType[BudDataType["str"] = 32] = "str";
    BudDataType[BudDataType["date"] = 41] = "date";
    BudDataType[BudDataType["datetime"] = 42] = "datetime";
})(BudDataType || (exports.BudDataType = BudDataType = {}));
;
class BizBase extends element_1.IElement {
    constructor(biz) {
        super();
        this.ui = {};
        this.biz = biz;
    }
    get type() { return BizPhraseType[this.bizPhraseType]; }
    setJName(jName) {
        if (jName === undefined)
            return;
        if (jName === this.name)
            return;
        this.jName = jName;
    }
    getJName() { var _a; return (_a = this.jName) !== null && _a !== void 0 ? _a : this.name; }
    buildSchema(res) {
        var _a, _b;
        return {
            id: this.id,
            name: this.name,
            jName: this.jName,
            type: this.type,
            phrase: this.phrase,
            // caption: res[this.phrase] ?? this.caption,
            ui: Object.assign(Object.assign({}, this.ui), { caption: (_a = res[this.phrase]) !== null && _a !== void 0 ? _a : (_b = this.ui) === null || _b === void 0 ? void 0 : _b.caption })
        };
    }
    ;
    okToDefineNewName(name) {
        return true;
    }
    get basePhrase() { return ''; }
    buildPhrase(prefix) {
        this.phrase = `${prefix}.${this.name}`;
    }
    buildPhrases(phrases, prefix) {
        var _a;
        this.buildPhrase(prefix);
        phrases.push([this.phrase, (_a = this.ui.caption) !== null && _a !== void 0 ? _a : '', this.basePhrase, this.typeNum]);
    }
    get typeNum() {
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