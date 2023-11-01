"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizQueryTableStatements = exports.PBizQueryValueStatements = exports.PBizQueryValue = exports.PBizQueryTable = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizQuery extends Base_1.PBizEntity {
}
class PBizQueryTable extends PBizQuery {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            super.parseHeader();
        }
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                let bud = this.parseSubItem();
                this.element.params.push(bud);
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
        const { statements: arr } = statements;
        const { length } = arr;
        if (length > 0) {
            const lastStatement = arr[length - 1];
            this.element.from = lastStatement;
        }
    }
    scan(space) {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        const { from, props } = this.element;
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
        }
        if (from === undefined || from.type !== 'from') {
            this.log(`FROM must be the last statement in QUERY`);
            ok = false;
        }
        else {
            const coll = {};
            for (let col of from.cols) {
                let { ui, bud } = col;
                if (ui.caption !== null) {
                    if (bud === undefined) {
                        this.log(`Bud can not be undefined`);
                        ok = false;
                    }
                    else {
                        let { name } = bud;
                        if (coll[name] === true) {
                            this.log(`duplicate ${name} in columns`);
                            ok = false;
                        }
                        else {
                            coll[name] = true;
                        }
                        if (this.element.hasParam(name) === true) {
                            this.log(`column ${name} duplicate with parameter`);
                            ok = false;
                        }
                        props.set(name, bud);
                    }
                }
            }
        }
        return ok;
    }
}
exports.PBizQueryTable = PBizQueryTable;
class PBizQueryValue extends PBizQuery {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
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
            case 'return': return new il_1.PutStatement(parent);
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
        if (this.query.hasParam(name) === true) {
            return new il_1.VarPointer();
        }
    }
}
//# sourceMappingURL=Query.js.map