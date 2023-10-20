"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizQueryTableStatements = exports.PBizQueryValueStatements = exports.PBizQueryValue = exports.PBizQueryTable = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizQuery extends Base_1.PBizBase {
}
class PBizQueryTable extends PBizQuery {
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let bud = this.parseSubItem();
                this.element.params[bud.name] = bud;
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        let statements = new il_1.BizQueryTableStatements(undefined);
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
    }
    scan(space) {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        const { statement } = this.element;
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
        }
        const { statements } = statement;
        const { length } = statements;
        if (length > 0) {
            const lastStatement = statements[length - 1];
            if (lastStatement.type !== 'from') {
                this.log(`FROM must be the last statement in QUERY`);
                ok = false;
            }
            else {
                this.element.from = lastStatement;
            }
        }
        return ok;
    }
}
exports.PBizQueryTable = PBizQueryTable;
class PBizQueryValue extends PBizQuery {
    _parse() {
        let statements = new il_1.BizQueryValueStatements(undefined);
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
        this.parseOn();
    }
    parseOn() {
        if (this.ts.isKeyword('on') === false)
            return;
        let on = [];
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                on.push(this.ts.passVar());
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        else {
            on.push(this.ts.passVar());
        }
        this.element.on = on;
    }
    scan(space) {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizQueryValue = PBizQueryValue;
class PBizQueryValueStatements extends statement_1.PStatements {
    statementFromKey(parent, key) {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'put': return new il_1.PutStatement(parent);
        }
    }
}
exports.PBizQueryValueStatements = PBizQueryValueStatements;
class PBizQueryTableStatements extends statement_1.PStatements {
    statementFromKey(parent, key) {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'from': return new il_1.FromStatement(parent);
        }
    }
}
exports.PBizQueryTableStatements = PBizQueryTableStatements;
class BizQuerySpace extends space_1.Space {
    constructor(outer, query) {
        super(outer);
        this.query = query;
    }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return;
    }
    _varPointer(name, isField) {
        if (isField === true)
            return;
        if (this.query.hasName(name) === true) {
            return new il_1.VarPointer();
        }
    }
}
//# sourceMappingURL=Query.js.map