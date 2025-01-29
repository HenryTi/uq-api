"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizLog = void 0;
const il_1 = require("../../../il");
const PStatement_1 = require("../../PStatement");
const tokens_1 = require("../../tokens");
class PBizLog extends PStatement_1.PStatement {
    _parse() {
        // let val = this.element.val = new ValueExpression();
        // this.context.parseElement(val);
        this.element.val = this.parseValue();
    }
    parseValue() {
        switch (this.ts.token) {
            default:
                return {
                    type: il_1.LogType.scalar,
                    value: this.parseScalar(),
                };
            case tokens_1.Token.COLON:
                this.ts.readToken();
                return {
                    type: il_1.LogType.object,
                    value: this.parseObject(),
                };
            case tokens_1.Token.SHARP:
                this.ts.readToken();
                return {
                    type: il_1.LogType.array,
                    value: this.parseArray(),
                };
        }
    }
    parseScalar() {
        let val = new il_1.ValueExpression();
        this.context.parseElement(val);
        return val;
    }
    parseArray() {
        let ret = [];
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            ret.push(this.parseValue());
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        return ret;
    }
    parseObject() {
        let ret = {};
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            let name = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.COLON);
            ret[name] = this.parseValue();
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        return ret;
    }
    scan(space) {
        let ok = true;
        const { val } = this.element;
        if (this.scanValue(space, val) === false) {
            ok = false;
        }
        return ok;
    }
    scanValue(space, { type, value }) {
        let ok = true;
        switch (type) {
            case il_1.LogType.scalar:
                if (this.scanScalar(space, value) === false) {
                    ok = false;
                }
                break;
            case il_1.LogType.array:
                if (this.scanArray(space, value) === false) {
                    ok = false;
                }
                break;
            case il_1.LogType.object:
                if (this.scanObject(space, value) === false) {
                    ok = false;
                }
                break;
        }
        return ok;
    }
    scanScalar(space, val) {
        let ok = true;
        if (val.pelement.scan(space) === false) {
            ok = false;
            // val.pelement.scan(space);
        }
        return ok;
    }
    scanArray(space, val) {
        let ok = true;
        for (let v of val) {
            if (this.scanValue(space, v) === false)
                ok = false;
        }
        return ok;
    }
    scanObject(space, val) {
        let ok = true;
        for (let i in val) {
            if (this.scanValue(space, val[i]) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBizLog = PBizLog;
//# sourceMappingURL=biz.log.js.map