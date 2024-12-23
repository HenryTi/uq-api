"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementFork = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const biz_statement_ID_1 = require("./biz.statement.ID");
const tokens_1 = require("../../tokens");
class PBizStatementFork extends biz_statement_ID_1.PBizStatementID {
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            let valFork = this.element.valFork = new il_1.ValueExpression();
            this.context.parseElement(valFork);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        else {
            this.entityName = this.ts.passVar();
            this.ts.passKey('in');
            this.ts.passToken(tokens_1.Token.EQU);
            this.parseUnique();
        }
        this.parseTo();
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entityName !== undefined) {
            let { bizEntityArr: [entity] } = space.getBizFromEntityArrFromName(this.entityName);
            if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.fork) {
                ok = false;
                this.log(`${this.entityName} is not SPEC`);
            }
            else {
                this.element.fork = entity;
                let length = this.element.fork.keys.length + 1;
                if (length !== this.inVals.length) {
                    ok = false;
                    this.log(`IN ${this.inVals.length} variables, must have ${length} variables`);
                }
            }
        }
        else {
            if (this.element.valFork.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizStatementFork = PBizStatementFork;
//# sourceMappingURL=biz.statement.fork.js.map