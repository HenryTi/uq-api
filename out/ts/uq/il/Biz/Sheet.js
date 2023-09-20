"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizDetailAct = exports.BizPend = exports.BizDetail = exports.BizMain = exports.BizSheet = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.sheet;
        this.acts = [];
    }
    parser(context) {
        return new parser_1.PBizSheet(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.main === undefined)
            debugger;
        ret = Object.assign(Object.assign({}, ret), { main: this.main.name, acts: this.acts.map(v => v.buildSchema(res)) });
        // this.entitySchema = JSON.stringify(ret);
        return ret;
    }
}
exports.BizSheet = BizSheet;
class BizMain extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.main;
    }
    parser(context) {
        return new parser_1.PBizMain(this, context);
    }
    buildSchema(res) {
        var _a;
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { target: (_a = this.target) === null || _a === void 0 ? void 0 : _a.buildSchema(res) });
    }
}
exports.BizMain = BizMain;
class BizDetail extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.detail;
        this.acts = [];
    }
    parser(context) {
        return new parser_1.PBizDetail(this, context);
    }
    buildSchema(res) {
        var _a, _b, _c, _d;
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { main: this.main.name, pend: (_a = this.pend) === null || _a === void 0 ? void 0 : _a.name, item: this.item, value: (_b = this.value) === null || _b === void 0 ? void 0 : _b.buildSchema(res), amount: (_c = this.amount) === null || _c === void 0 ? void 0 : _c.buildSchema(res), price: (_d = this.price) === null || _d === void 0 ? void 0 : _d.buildSchema(res) });
    }
}
exports.BizDetail = BizDetail;
class BizPend extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.pend;
    }
    // detail: BizDetail;
    parser(context) {
        return new parser_1.PBizPend(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign({}, ret);
    }
}
exports.BizPend = BizPend;
class BizDetailAct extends Base_1.BizBase {
    // fromPend: BizPend;
    constructor(bizDetail) {
        super();
        this.bizPhraseType = Base_1.BizPhraseType.detailAct;
        this.tableVars = {};
        this.bizDetail = bizDetail;
    }
    parser(context) {
        return new parser_1.PBizDetailAct(this, context);
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
    buildSchema(res) {
        let ret = super.buildSchema(res);
        return Object.assign(Object.assign({}, ret), { 
            // fromPend: this.fromPend?.name,
            detail: this.bizDetail.name });
    }
}
exports.BizDetailAct = BizDetailAct;
//# sourceMappingURL=Sheet.js.map