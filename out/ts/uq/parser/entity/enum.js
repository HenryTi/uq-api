"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEnum = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PEnum extends entity_1.PEntity {
    constructor() {
        super(...arguments);
        this.duplicateKeys = [];
    }
    scanDoc2() {
        return true;
    }
    _parse() {
        this.setName();
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        this.entity.keyValues = {};
        const { keyValues } = this.entity;
        this.entity.keyValuesSchema = {};
        for (;;) {
            this.ts.assertVar();
            let key = this.ts.lowerVar;
            let vKey = this.ts._var;
            this.ts.readToken();
            this.ts.assertToken(tokens_1.Token.EQU);
            this.ts.readToken();
            let v;
            switch (this.ts.token) {
                case tokens_1.Token.SUB:
                    this.ts.readToken();
                    this.ts.assertToken(tokens_1.Token.NUM);
                    v = -this.ts.dec;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.NUM:
                    v = this.ts.dec;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.HEX:
                    v = Number.parseInt(this.ts.text, 16);
                    this.ts.readToken();
                    break;
                /*
                enum的值应该只支持数字
                case Token.STRING:
                    v = this.ts.text;
                    this.ts.readToken();
                    break;
                */
                default:
                    this.ts.expectToken(tokens_1.Token.NUM); //, Token.STRING);
                    break;
            }
            if (keyValues[key] !== undefined) {
                this.duplicateKeys.push(vKey);
            }
            keyValues[key] = {
                key: vKey,
                val: v,
            };
            this.entity.keyValuesSchema[vKey] = v;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
    }
    scan(space) {
        let ok = true;
        if (this.duplicateKeys.length > 0) {
            this.log(this.duplicateKeys.map(v => `'${v}'`).join(', ') + ' duplicated.');
            ok = false;
        }
        let { keyValues } = this.entity;
        for (let i in keyValues) {
            let { val } = keyValues[i];
            if (val < -0x7fff || val > 0x7fff) {
                this.log(`${i}: enum值最大0x7FFF, 最小-0x7FFF`);
                ok = false;
            }
        }
        return ok;
    }
}
exports.PEnum = PEnum;
//# sourceMappingURL=enum.js.map