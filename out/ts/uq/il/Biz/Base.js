"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizAct = exports.BizSearch = exports.BizBase = void 0;
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
    get theEntity() {
        debugger;
        return undefined;
    }
    setJName(jName) {
        if (jName === undefined)
            return;
        if (jName === this.name)
            return;
        this.jName = jName;
    }
    getJName() { return this.jName ?? this.name; }
    buildSchema(res) {
        let ui;
        let caption = res[this.phrase] ?? this.ui?.caption;
        if (caption !== undefined) {
            if (this.ui === undefined)
                ui = { caption };
            else
                ui = {
                    ...this.ui,
                    caption,
                };
        }
        else {
            ui = this.ui;
        }
        return {
            id: this.id,
            name: this.name,
            jName: this.jName,
            type: this.type,
            phrase: this.phrase,
            ui,
        };
    }
    ;
    getBud(name) {
        return undefined;
    }
    get extendsPhrase() { return ''; }
    buildPhrase(prefix) {
        this.phrase = `${prefix}.${this.name}`;
    }
    buildPhrases(phrases, prefix) {
        this.buildPhrase(prefix);
        phrases.push([this.phrase, this.ui.caption ?? '', this.extendsPhrase, this.typeNum]);
    }
    get typeNum() {
        let n = BizPhraseType_1.BizPhraseType[this.type] ?? 0;
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
    getBudClass(budClass) {
        return;
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
class BizAct extends BizBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = BizPhraseType_1.BizPhraseType.act;
        this.tableVars = {};
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
}
exports.BizAct = BizAct;
//# sourceMappingURL=Base.js.map