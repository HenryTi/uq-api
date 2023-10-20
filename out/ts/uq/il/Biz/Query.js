"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizQueryTableStatements = exports.BizQueryTable = exports.BizQueryValueStatements = exports.BizQueryValue = exports.BizQuery = void 0;
const Query_1 = require("../../parser/Biz/Query");
const element_1 = require("../element");
const statement_1 = require("../statement");
class BizQuery extends element_1.IElement {
    constructor(biz) {
        super();
        this.biz = biz;
    }
}
exports.BizQuery = BizQuery;
class BizQueryValue extends BizQuery {
    constructor() {
        super(...arguments);
        this.type = 'queryvalue';
    }
    parser(context) {
        return new Query_1.PBizQueryValue(this, context);
    }
}
exports.BizQueryValue = BizQueryValue;
class BizQueryValueStatements extends statement_1.Statements {
    parser(context) {
        return new Query_1.PBizQueryValueStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryValueStatements = BizQueryValueStatements;
class BizQueryTable extends BizQuery {
    constructor() {
        super(...arguments);
        this.type = 'queryvalue';
    }
    parser(context) {
        return new Query_1.PBizQueryTable(this, context);
    }
}
exports.BizQueryTable = BizQueryTable;
class BizQueryTableStatements extends statement_1.Statements {
    parser(context) {
        throw new Error("Method not implemented.");
    }
    db(db) {
        return;
    }
}
exports.BizQueryTableStatements = BizQueryTableStatements;
//# sourceMappingURL=Query.js.map