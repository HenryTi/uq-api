"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PConst = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PConst extends entity_1.PEntity {
    scanDoc2() {
        return true;
    }
    _parse() {
        this.setName();
        this.ts.assertToken(tokens_1.Token.EQU);
        this.ts.readToken();
        this.entity.keyValues = {};
        this.entity.keyValuesSchema = {};
        if (this.ts.token === tokens_1.Token.LBRACE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                    break;
                }
                let { lowerVar, _var } = this.ts;
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.COLON) {
                    this.ts.expectToken(tokens_1.Token.COLON);
                    break;
                }
                this.ts.readToken();
                let val = new il_1.ValueExpression();
                let parser = val.parser(this.context);
                parser.parse();
                this.entity.values[lowerVar] = val;
                let { atoms } = val;
                if (atoms.length === 1) {
                    let a = atoms[0];
                    let { scalarValue } = a;
                    if (scalarValue !== undefined) {
                        this.entity.keyValues[lowerVar] = {
                            key: _var,
                            val: String(scalarValue).toLowerCase(),
                        };
                    }
                }
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token !== tokens_1.Token.COMMA) {
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RBRACE);
                    break;
                }
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            let val = new il_1.ValueExpression();
            let parser = val.parser(this.context);
            parser.parse();
            this.entity.values['$'] = val;
        }
    }
    scan(space) {
        let { values } = this.entity;
        let ok = true;
        for (let i in values) {
            let val = values[i];
            if (val.pelement.scan(space) === false)
                ok = false;
        }
        if (this.scanKeyValues() === false)
            ok = false;
        return ok;
    }
    scanKeyValues() {
        const { keyValues } = this.entity;
        if (keyValues === undefined)
            return true;
        this.entity.keyValuesSchema = {};
        for (let i in keyValues) {
            let { key, val } = keyValues[i];
            if (key === undefined)
                key = i;
            let scalarValue;
            if (Array.isArray(val) === true) {
                let [v0, v1] = val;
                scalarValue = this.entity.uq.calcKeyValue(v0, v1);
                if (scalarValue === undefined) {
                    this.log(`${v0}.${v1} is not defined`);
                }
            }
            else {
                scalarValue = val;
            }
            this.entity.keyValuesSchema[key] = scalarValue;
        }
        return true;
    }
}
exports.PConst = PConst;
//# sourceMappingURL=const.js.map