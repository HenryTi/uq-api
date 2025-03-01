"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizStatementAtom = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const biz_statement_ID_1 = require("./biz.statement.ID");
class PBizStatementAtom extends biz_statement_ID_1.PBizStatementID {
    constructor() {
        super(...arguments);
        this.IDType = BizPhraseType_1.BizPhraseType.atom;
    }
    _parse() {
        this.idName = this.ts.passVar();
        // this.parseIDEntity();
        this.parseId();
        this.parseUnique();
        this.parseSets();
    }
    parseUnique() {
        if (this.ts.isKeyword('no') === true) {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                this.element.noVal = new il_1.ValueExpression();
                this.context.parseElement(this.element.noVal);
            }
            else if (this.ts.isKeyword('auto') === true) {
                this.ts.readToken();
                this.element.noVal = null;
            }
            else {
                this.element.noVal = new il_1.ValueExpression();
                this.context.parseElement(this.element.noVal);
            }
            return;
        }
        if (this.ts.isKeyword('unique') === true) {
            this.ts.readToken();
            this.element.uniqueName = this.ts.passVar();
            this.element.uniqueVals = this.parseValueArray();
        }
    }
    setField(fieldName, val) {
        if (fieldName === 'ex') {
            this.element.ex = val;
            return true;
        }
        return false;
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        const { noVal, ex } = this.element;
        if (ex !== undefined) {
            if (ex.pelement.scan(space) === false) {
                ok = false;
            }
        }
        else {
            ok = false;
            this.log('EX must set value');
        }
        if (noVal !== undefined && noVal !== null) {
            if (noVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
    keyDefined() {
        if (super.keyDefined() === true)
            return true;
        if (this.element.noVal !== undefined)
            return true;
        return false;
    }
    scanUnique(space, bizID, un, vals) {
        let ok = true;
        if (bizID !== undefined) {
            const { uniques } = bizID;
            if (uniques === undefined) {
                if (un !== undefined) {
                    ok = false;
                    this.log(`${bizID.getJName()} does not have UNIQUE`);
                }
            }
            else {
                let ret = uniques.find(v => v.name === un);
                if (ret === undefined) {
                    ok = false;
                    this.log(`UNQIUE ${un} not defined in ${bizID.jName}`);
                }
                else {
                    const { keys } = ret;
                    if (vals.length !== keys.length) {
                        ok = false;
                        this.log(`UNIQUE ${un} has ${keys.length} fields`);
                    }
                }
            }
        }
        return ok;
    }
}
exports.PBizStatementAtom = PBizStatementAtom;
//# sourceMappingURL=biz.statement.atom.js.map