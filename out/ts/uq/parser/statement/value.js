"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PValueStatement = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const PStatement_1 = require("../PStatement");
class PValueStatement extends PStatement_1.PStatement {
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
        }
        this.table = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('xi') === true) {
            this.ts.readToken();
            this.valueXi = new il_1.ValueXi();
            this.element.valueXi = this.valueXi;
            this.parseValueXi();
        }
        else {
            this.ts.expect('xi');
        }
        if (this.ts.token === tokens_1.Token.SEMICOLON)
            this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let entity = space.getEntity(this.table);
        if (entity === undefined) {
            this.log(`${this.table} not defined`);
            return false;
        }
        if (entity.type !== 'ix') {
            this.log(`${this.table} is not IX`);
            return false;
        }
        this.valueXi.IX = entity;
        let { xi } = this.valueXi;
        if (xi.pelement.scan(space) === false)
            ok = false;
        if (this.varType) {
            let varTypePointer = space.varPointer(this.varType, false);
            if (!varTypePointer) {
                this.log(`${this.varType} is not defined`);
                ok = false;
            }
            this.valueXi.varType = this.varType;
            this.valueXi.typePointer = varTypePointer;
        }
        if (this.varValue) {
            let varValuePointer = space.varPointer(this.varValue, false);
            if (!varValuePointer) {
                this.log(`${this.varValue} is not defined`);
                ok = false;
            }
            this.valueXi.varValue = this.varValue;
            this.valueXi.valuePointer = varValuePointer;
        }
        let { IX } = this.valueXi;
        if (['$uid', '$uuid', '$ulocal', '$uminute', '$global', '$local', '$minute'].findIndex(v => v === IX.x.idType) < 0) {
            this.log(`${IX.jName} is not support VALUE XI= statement, ${IX.jName} xi field must define ID type`);
            ok = false;
        }
        return ok;
    }
    parseValueXi() {
        if (this.ts.token !== tokens_1.Token.EQU) {
            this.ts.expectToken(tokens_1.Token.EQU);
        }
        this.ts.readToken();
        let ixVal = new il_1.ValueExpression();
        ixVal.parser(this.context).parse();
        this.valueXi.xi = ixVal;
        if (this.ts.isKeyword('type') === true) {
            this.ts.readToken();
            this.parseValueXiType();
            if (this.ts.isKeyword('value') === true) {
                this.ts.readToken();
                this.parseValueXiValue();
            }
        }
        else if (this.ts.isKeyword('value') === true) {
            this.ts.readToken();
            this.parseValueXiValue();
            if (this.ts.isKeyword('type') === true) {
                this.ts.readToken();
                this.parseValueXiType();
            }
        }
    }
    parseValueVar() {
        if (this.ts.isKeyword('into') === false) {
            this.ts.expect('into');
        }
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expectToken(tokens_1.Token.VAR);
        }
        let ret = this.ts.lowerVar;
        this.ts.readToken();
        return ret;
    }
    parseValueXiType() {
        this.varType = this.parseValueVar();
    }
    parseValueXiValue() {
        this.varValue = this.parseValueVar();
    }
}
exports.PValueStatement = PValueStatement;
//# sourceMappingURL=value.js.map