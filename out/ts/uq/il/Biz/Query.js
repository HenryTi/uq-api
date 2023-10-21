"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizQueryTableStatements = exports.BizQueryTable = exports.BizQueryValueStatements = exports.BizQueryValue = exports.BizQuery = void 0;
const BizQuery_1 = require("../../builder/Biz/BizQuery");
const parser_1 = require("../../parser");
const statement_1 = require("../statement");
const Base_1 = require("./Base");
const Entity_1 = require("./Entity");
class BizQuery extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.query;
    }
}
exports.BizQuery = BizQuery;
class BizQueryValue extends BizQuery {
    constructor() {
        super(...arguments);
        this.fields = [];
    }
    get type() { return 'queryvalue'; }
    parser(context) {
        return new parser_1.PBizQueryValue(this, context);
    }
    hasParam(name) {
        if (this.on === undefined)
            return false;
        return this.on.includes(name);
    }
}
exports.BizQueryValue = BizQueryValue;
class BizQueryValueStatements extends statement_1.Statements {
    parser(context) {
        return new parser_1.PBizQueryValueStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryValueStatements = BizQueryValueStatements;
class BizQueryTable extends BizQuery {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.params = [];
    }
    get type() { return 'query'; }
    parser(context) {
        return new parser_1.PBizQueryTable(this, context);
    }
    hasParam(name) {
        let index = this.params.findIndex(v => v.name === name);
        return index >= 0;
    }
    db(dbContext) {
        return new BizQuery_1.BBizQuery(dbContext, this);
    }
}
exports.BizQueryTable = BizQueryTable;
class BizQueryTableStatements extends statement_1.Statements {
    parser(context) {
        return new parser_1.PBizQueryTableStatements(this, context);
    }
    db(db) {
        return;
    }
}
exports.BizQueryTableStatements = BizQueryTableStatements;
//# sourceMappingURL=Query.js.map