"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTie = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTie extends Base_1.PBizEntity {
    get defaultName() { return undefined; }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            assign: this.parseAssign,
        };
        const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    // bud 有没有type。Tie里面的bud，不需要type，都是bigint
    parseBud(type, name, caption) {
        return new il_1.BizBudInt(type, name, caption);
    }
}
exports.PBizTie = PBizTie;
//# sourceMappingURL=Tie.js.map