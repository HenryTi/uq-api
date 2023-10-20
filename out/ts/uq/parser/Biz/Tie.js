"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTie = void 0;
const il_1 = require("../../il");
const Base_1 = require("./Base");
class PBizTie extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        /*
        protected parseContent(): void {
            const keyColl = {
                prop: this.parseProp,
                // assign: this.parseAssign,
            };
            const keys = Object.keys(keyColl);
            for (; ;) {
                if (this.ts.token === Token.RBRACE) break;
                let parse = keyColl[this.ts.lowerVar];
                if (this.ts.varBrace === true || parse === undefined) {
                    this.ts.expect(...keys);
                }
                this.ts.readToken();
                parse();
            }
        }
        */
        this.keyColl = {
            prop: this.parseProp,
            // assign: this.parseAssign,
        };
    }
    // bud 有没有type。Tie里面的bud，不需要type，都是bigint
    parseBud(name, caption) {
        return new il_1.BizBudInt(this.element.biz, name, caption);
    }
}
exports.PBizTie = PBizTie;
//# sourceMappingURL=Tie.js.map