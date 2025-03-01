"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementFork = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const biz_statement_ID_1 = require("./biz.statement.ID");
const tokens_1 = require("../../tokens");
class PBizStatementFork extends biz_statement_ID_1.PBizStatementID {
    constructor() {
        super(...arguments);
        this.IDType = BizPhraseType_1.BizPhraseType.fork;
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            this.idName = this.ts.passVar();
            this.element.uniqueVals = this.parseValueArray();
            if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
            this.parseSets();
        }
        else if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.element.valFork = new il_1.ValueExpression();
            this.context.parseElement(this.element.valFork);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                this.toVar = this.ts.passVar();
            }
        }
        // this.parseIDEntity();
        // this.parseId();
    }
    /*
    protected parseUnique(): [string, ValueExpression[]] {
        if (this.ts.isKeyword('key') === false) return;
        this.ts.readToken();
        let vals = this.parseValueArray();
        return ['key', vals];
    }
    */
    scanBizID(space) {
        if (this.idName === undefined) {
            return true;
        }
        return super.scanBizID(space);
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        const { valFork } = this.element;
        if (valFork !== undefined) {
            if (valFork.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scanUnique(space, bizID, un, vals) {
        let ok = true;
        const { keys } = bizID;
        if (vals.length !== keys.length) {
            ok = false;
            this.log(`UNIQUE ${un} has ${keys.length} fields`);
        }
        return ok;
    }
}
exports.PBizStatementFork = PBizStatementFork;
//# sourceMappingURL=biz.statement.fork.js.map