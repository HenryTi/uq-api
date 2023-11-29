"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSearch = exports.BizBase = void 0;
const IElement_1 = require("../IElement");
const BizPhraseType_1 = require("./BizPhraseType");
const parser_1 = require("../../parser");
class BizBase extends IElement_1.IElement {
    constructor(biz) {
        super();
        this.ui = {};
        this.biz = biz;
    }
    get type() { return BizPhraseType_1.BizPhraseType[this.bizPhraseType]; }
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
            ui: Object.assign(Object.assign({}, this.ui), { caption: (_a = res[this.phrase]) !== null && _a !== void 0 ? _a : (_b = this.ui) === null || _b === void 0 ? void 0 : _b.caption })
        };
    }
    ;
    /*
    hasProp(name: string): boolean {
        return false;
    }
    */
    getBud(name) {
        return undefined;
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
        let n = (_a = BizPhraseType_1.BizPhraseType[this.type]) !== null && _a !== void 0 ? _a : 0;
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
class BizSearch extends IElement_1.IElement {
    constructor(bizEntity) {
        super();
        this.type = 'bizsearch';
        this.params = [];
        this.bizEntity = bizEntity;
    }
    parser(context) {
        return new parser_1.PBizSearch(this, context);
    }
}
exports.BizSearch = BizSearch;
//# sourceMappingURL=Base.js.map