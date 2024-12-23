"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementID = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const biz_statement_sub_1 = require("./biz.statement.sub");
class PBizStatementID extends biz_statement_sub_1.PBizStatementSub {
    constructor() {
        super(...arguments);
        this.entityCase = [];
        this.inVals = [];
    }
    _parse() {
        this.parseIDEntity();
        this.ts.passKey('in');
        this.ts.passToken(tokens_1.Token.EQU);
        this.parseUnique();
        this.parseTo();
    }
    parseIDEntity() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                this.ts.passKey('when');
                let condition = new il_1.CompareExpression();
                this.context.parseElement(condition);
                this.ts.passKey('then');
                let entityName = this.ts.passVar();
                this.entityCase.push({ condition, entityName });
                if (this.ts.isKeyword('else') === true) {
                    this.ts.readToken();
                    entityName = this.ts.passVar();
                    this.entityCase.push({ entityName, condition: undefined });
                    break;
                }
            }
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        else {
            this.entityCase.push({ entityName: this.ts.passVar(), condition: undefined });
        }
    }
    parseUnique() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                this.inVals.push(val);
                const { token } = this.ts;
                if (token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        else {
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.inVals.push(val);
        }
    }
    parseTo() {
        this.ts.passKey('to');
        this.toVar = this.ts.passVar();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        this.element.toVar = space.varPointer(this.toVar, false);
        if (this.element.toVar === undefined) {
            ok = false;
            this.log(`${this.toVar} is not defined`);
        }
        for (let inVal of this.inVals) {
            if (inVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        this.element.inVals = this.inVals;
        return ok;
    }
}
exports.PBizStatementID = PBizStatementID;
//# sourceMappingURL=biz.statement.ID.js.map