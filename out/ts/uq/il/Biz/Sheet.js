"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizDetailAct = exports.BizPend = exports.BizDetail = exports.BizMain = exports.BizSheet = void 0;
const builder_1 = require("../../builder");
const builder_2 = require("../../builder");
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.sheet;
        this.details = [];
    }
    parser(context) {
        return new parser_1.PBizSheet(this, context);
    }
    buildSchema(res) {
        let ret = super.buildSchema(res);
        if (this.main === undefined)
            debugger;
        ret = Object.assign(Object.assign({}, ret), { main: this.main.name, details: this.details.map(v => {
                const { detail, caption } = v;
                return {
                    detail: detail.name,
                    caption, // 此处暂时不做res翻译
                };
            }) });
        return ret;
    }
    db(dbContext) {
        return new builder_1.BBizSheet(dbContext, this);
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
        var _a, _b, _c;
        let ret = super.buildSchema(res);
        let pend;
        if (this.pend !== undefined) {
            let { caption, entity } = this.pend;
            pend = {
                caption,
                entity: entity.name
            };
        }
        return Object.assign(Object.assign({}, ret), { main: this.main.name, pend, item: this.item, itemx: this.itemX, value: (_a = this.value) === null || _a === void 0 ? void 0 : _a.buildSchema(res), amount: (_b = this.amount) === null || _b === void 0 ? void 0 : _b.buildSchema(res), price: (_c = this.price) === null || _c === void 0 ? void 0 : _c.buildSchema(res) });
    }
    forEachBud(callback) {
        super.forEachBud(callback);
        if (this.value !== undefined)
            callback(this.value);
        if (this.price !== undefined)
            callback(this.price);
        if (this.amount !== undefined)
            callback(this.amount);
    }
    db(dbContext) {
        return new builder_2.BBizDetail(dbContext, this);
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