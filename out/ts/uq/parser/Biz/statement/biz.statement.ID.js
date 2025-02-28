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
        this.sets = {};
        this.hasUnique = true; // every entity has its unique
    }
    parseIDEntity() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                this.ts.passKey('when');
                let condition = new il_1.CompareExpression();
                this.context.parseElement(condition);
                this.ts.passKey('then');
                this.parseEntityAndUnique(condition);
                if (this.ts.isKeyword('else') === true) {
                    this.ts.readToken();
                    this.parseEntityAndUnique(undefined);
                    break;
                }
            }
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
        }
        else {
            this.parseEntityAndUnique(undefined);
        }
    }
    parseEntityAndUnique(condition) {
        let entityName = this.ts.passVar();
        let retUnique = this.parseUnique();
        if (retUnique === undefined) {
            this.entityCase.push({ condition, entityName, uniqueName: undefined, uniqueVals: undefined });
        }
        else {
            const [uniqueName, uniqueVals] = retUnique;
            this.entityCase.push({ condition, entityName, uniqueName, uniqueVals });
        }
    }
    setField(fieldName, val) {
        return false;
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
            if (this.setField(bud, val) === false) {
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
    parseId() {
        if (this.ts.isKeyword('id') !== true)
            return;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
            this.element.idVal = new il_1.ValueExpression;
            this.context.parseElement(this.element.idVal);
        }
        else {
            this.ts.passKey('to');
            this.toVar = this.ts.passVar();
        }
    }
    scan(space) {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        if (this.toVar !== undefined) {
            this.element.toVar = space.varPointer(this.toVar, false);
            if (this.element.toVar === undefined) {
                ok = false;
                this.log(`${this.toVar} is not defined`);
            }
        }
        const { entityCase, idVal, sets } = this.element;
        if (idVal !== undefined) {
            if (idVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        for (let { entityName, condition, uniqueName, uniqueVals } of this.entityCase) {
            let bizID = this.scanEntity(space, entityName);
            if (bizID === undefined) {
                ok = false;
            }
            if (condition !== undefined) {
                if (condition.pelement.scan(space) === false)
                    ok = false;
            }
            if (uniqueName === uniqueName)
                this.hasUnique = false;
            if (this.scanUnique(space, bizID, uniqueName, uniqueVals) === false)
                ok = false;
            entityCase.push({ bizID, condition, uniqueName, uniqueVals });
        }
        function getBud(budName) {
            for (let { bizID } of entityCase) {
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
        if (this.keyDefined() === false) {
            ok = false;
            this.log('KEY must be defined');
        }
        return ok;
    }
    keyDefined() {
        if (this.element.idVal !== undefined)
            return true;
        if (this.hasUnique === true)
            return true;
        return false;
    }
    scanEntity(space, entityName) {
        let fromEntityArr = space.getBizFromEntityArrFromName(entityName);
        if (fromEntityArr === undefined) {
            this.log(`${entityName} is not defined`);
            return undefined;
        }
        let { bizEntityArr: [entity] } = fromEntityArr;
        if (entity.bizPhraseType !== this.IDType) {
            return undefined;
        }
        return entity;
    }
}
exports.PBizStatementID = PBizStatementID;
//# sourceMappingURL=biz.statement.ID.js.map