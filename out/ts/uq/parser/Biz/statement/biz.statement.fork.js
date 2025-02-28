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
            this.fork = this.ts.passVar();
            this.element.inVals = this.parseValueArray();
        }
        else if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.element.valFork = new il_1.ValueExpression();
            this.context.parseElement(this.element.valFork);
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        if (this.ts.isKeyword('to') === true) {
            this.ts.readToken();
            this.toVar = this.ts.passVar();
        }
        // this.parseIDEntity();
        // this.parseId();
        // this.parseSets();
    }
    parseUnique() {
        if (this.ts.isKeyword('key') === false)
            return;
        this.ts.readToken();
        let vals = this.parseValueArray();
        return ['key', vals];
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.fork !== undefined) {
            let fromEntityArr = space.getBizFromEntityArrFromName(this.fork);
            if (fromEntityArr === undefined) {
                ok = false;
                this.log(`FORK ${this.fork} not defined`);
            }
            else {
                const { bizEntityArr: [entity] } = fromEntityArr;
                if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.fork) {
                    ok = false;
                    this.log(`${this.fork} is not FORK`);
                }
                else {
                    this.element.fork = entity;
                }
            }
        }
        const { inVals, valFork } = this.element;
        if (inVals !== undefined) {
            for (let val of inVals) {
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
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