"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizFor = void 0;
const builder_1 = require("../../../builder");
const parser_1 = require("../../../parser");
const biz_select_1 = require("./biz.select");
class BizFor extends biz_select_1.BizSelectStatement {
    constructor() {
        super(...arguments);
        // readonly forCols: Var[] = [];
        this.vars = {};
        this.ids = new Map();
        this.values = new Map();
    }
    db(db) {
        return new builder_1.BBizFor(db, this);
    }
    parser(context) {
        return new parser_1.PBizFor(this, context);
    }
}
exports.BizFor = BizFor;
//# sourceMappingURL=biz.for.js.map