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
        this.sets = {};
    }
    _parse() {
        this.parseIDEntity();
        let key = this.ts.passKey();
        switch (key) {
            case 'no':
                if (this.ts.isKeyword('auto') === true) {
                    this.ts.readToken();
                }
                else {
                    this.parseUnique();
                }
                break;
            case 'unique':
                this.unique = this.ts.passVar();
                this.parseUnique();
                break;
            default: this.ts.expect('no', 'unique');
        }
        this.parseTo();
        this.parseSets();
    }
    parseSets() {
        if (this.ts.token !== tokens_1.Token.VAR)
            return;
        if (this.ts.varBrace === true || this.ts.lowerVar !== 'set') {
            this.ts.expect('set');
        }
        this.ts.readToken();
        for (;;) {
            let bud = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            if (bud === 'ex') {
                this.element.ex = val;
            }
            else {
                this.sets[bud] = val;
            }
            const { token } = this.ts;
            if (token === tokens_1.Token.SEMICOLON) {
                // this.ts.readToken();
                break;
            }
            if (token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        for (let { entityName, condition } of this.entityCase) {
            if (condition !== undefined) {
                if (condition.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            let fromEntityArr = space.getBizFromEntityArrFromName(entityName);
            if (fromEntityArr === undefined) {
                ok = false;
                this.log(`${entityName} is not defined`);
            }
            else {
                let { bizEntityArr: [entity] } = fromEntityArr;
                if (entity === undefined) {
                    ok = false;
                    this.log(`${entityName} is not defined`);
                }
                else if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.atom) {
                    ok = false;
                    this.log(`${entityName} is not ATOM`);
                }
                else {
                    this.element.atomCase.push({ bizID: entity, condition });
                }
            }
        }
        const { atomCase, sets, ex } = this.element;
        let { length } = this.inVals;
        if (this.unique === undefined) {
            if (length > 1) {
                ok = false;
                this.log(`NO ${length} variables, can only have 1 variable`);
            }
        }
        else {
            let unique;
            for (let { bizID } of atomCase) {
                let unq = bizID.getUnique(this.unique);
                if (unq === undefined) {
                    ok = false;
                    this.log(`ATOM ${bizID.getJName()} has no UNIQUE ${this.unique}`);
                }
                else if (unique === undefined) {
                    unique = unq;
                }
                else if (unq !== unique) {
                    ok = false;
                    this.log(`${this.unique} is different across ATOMS`);
                }
            }
            this.element.unique = unique;
        }
        if (ex !== undefined) {
            if (ex.pelement.scan(space) === false) {
                ok = false;
            }
        }
        else {
            ok = false;
            this.log('EX must set value');
        }
        function getBud(budName) {
            for (let { bizID } of atomCase) {
                let bud = bizID.getBud(budName);
                if (bud !== undefined)
                    return bud;
            }
        }
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            let bud = getBud(i);
            if (bud === undefined) {
                ok = false;
                this.log(`ATOM has no PROP ${i}`);
            }
            sets.set(bud, val);
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        const { unique } = this.element;
        if (unique.keys.length + 1 !== this.inVals.length) {
            ok = false;
            this.log(`ATOM UNIQUE ${this.unique} keys count mismatch`);
        }
        return ok;
    }
}
exports.PBizStatementAtom = PBizStatementAtom;
//# sourceMappingURL=biz.statement.atom.js.map