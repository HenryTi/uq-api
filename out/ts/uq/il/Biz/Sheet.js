"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizDetailAct = exports.BizPend = exports.BizDetail = exports.BizMain = exports.BizSheet = void 0;
const parser_1 = require("../../parser");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizSheet extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'sheet';
        this.acts = [];
    }
    parser(context) {
        return new parser_1.PBizSheet(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { main: this.main.name, acts: this.acts.map(v => v.buildSchema()) });
    }
}
exports.BizSheet = BizSheet;
class BizMain extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'main';
    }
    parser(context) {
        return new parser_1.PBizMain(this, context);
    }
    buildSchema() {
        var _a;
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { target: (_a = this.target) === null || _a === void 0 ? void 0 : _a.buildSchema() });
    }
}
exports.BizMain = BizMain;
class BizDetail extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'detail';
        this.acts = [];
    }
    parser(context) {
        return new parser_1.PBizDetail(this, context);
    }
    buildSchema() {
        var _a, _b, _c, _d, _e;
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { main: this.main.name, pend: (_a = this.pend) === null || _a === void 0 ? void 0 : _a.name, item: (_b = this.item) === null || _b === void 0 ? void 0 : _b.buildSchema(), value: (_c = this.value) === null || _c === void 0 ? void 0 : _c.buildSchema(), amount: (_d = this.amount) === null || _d === void 0 ? void 0 : _d.buildSchema(), price: (_e = this.price) === null || _e === void 0 ? void 0 : _e.buildSchema() });
    }
}
exports.BizDetail = BizDetail;
class BizPend extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.type = 'pend';
    }
    // detail: BizDetail;
    parser(context) {
        return new parser_1.PBizPend(this, context);
    }
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign({}, ret);
    }
}
exports.BizPend = BizPend;
class BizDetailAct extends Base_1.BizBase {
    // fromPend: BizPend;
    constructor(bizDetail) {
        super();
        this.type = 'detailAct';
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
    buildSchema() {
        let ret = super.buildSchema();
        return Object.assign(Object.assign({}, ret), { 
            // fromPend: this.fromPend?.name,
            detail: this.bizDetail.name });
    }
}
exports.BizDetailAct = BizDetailAct;
//# sourceMappingURL=Sheet.js.map