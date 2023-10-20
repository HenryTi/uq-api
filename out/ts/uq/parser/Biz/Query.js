"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizQueryValueStatements = exports.PBizQueryValue = exports.PBizQueryTable = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const statement_1 = require("../statement");
const tokens_1 = require("../tokens");
class PBizQuery extends element_1.PElement {
}
class PBizQueryTable extends PBizQuery {
    _parse() {
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
        if (this.ts.isKeyword('on') === true) {
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
            return;
        }
    }
    scan(space) {
        let ok = true;
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
//# sourceMappingURL=Query.js.map