"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizOptions = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizOptions extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {};
    }
    _parse() {
        let jName;
        const { token } = this.ts;
        if (token === tokens_1.Token.VAR) {
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        this.element.ui = this.parseUI();
        this.element.setJName(jName);
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.assertToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let ui = this.parseUI();
            let value;
            if (this.ts.token === tokens_1.Token.EQU) {
                this.ts.readToken();
                switch (this.ts.token) {
                    default:
                        this.ts.expectToken(tokens_1.Token.STRING, tokens_1.Token.NUM);
                        break;
                    case tokens_1.Token.STRING:
                        value = this.ts.text;
                        break;
                    case tokens_1.Token.NUM:
                        value = this.ts.dec;
                        break;
                }
                this.ts.readToken();
            }
            let type;
            switch (typeof value) {
                default:
                case 'undefined':
                    type = il_1.OptionsItemValueType.none;
                    break;
                case 'string':
                    type = il_1.OptionsItemValueType.str;
                    break;
                case 'number':
                    type = Number.isInteger(value) === true ? il_1.OptionsItemValueType.int : il_1.OptionsItemValueType.dec;
                    break;
            }
            let item = new il_1.OptionsItem(this.element, name, ui);
            item._itemType = type;
            item.itemValue = value;
            item.memo = String(value);
            this.element.items.push(item);
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
            }
        }
    }
}
exports.PBizOptions = PBizOptions;
//# sourceMappingURL=Options.js.map