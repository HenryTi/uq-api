"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizQueryTableStatements = exports.BizQueryTable = exports.BizQueryValueStatements = exports.BizQueryValue = exports.BizQuery = void 0;
const parser_1 = require("../../parser");
const statement_1 = require("../statement");
const Base_1 = require("./Base");
class BizQuery extends Base_1.BizBase {
    constructor() {
        super(...arguments);
        this.bizPhraseType = Base_1.BizPhraseType.query;
    }
}
exports.BizQuery = BizQuery;
class BizQueryValue extends BizQuery {
    get type() { return 'queryvalue'; }
    parser(context) {
        return new parser_1.PBizQueryValue(this, context);
    }
    hasName(name) {
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
        this.params = {};
    }
    get type() { return 'queryvalue'; }
    parser(context) {
        return new parser_1.PBizQueryTable(this, context);
    }
    hasName(name) {
        return this.params[name] !== undefined;
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