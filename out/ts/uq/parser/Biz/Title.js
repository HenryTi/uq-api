"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTitle = void 0;
// import { Token } from "../tokens";
const Base_1 = require("./Base");
class PBizTitle extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.keyColl = {
            prop: this.parseProp,
        };
        /*
        protected parseContent(): void {
            const keyColl = {
                prop: this.parseProp,
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
    }
}
exports.PBizTitle = PBizTitle;
//# sourceMappingURL=Title.js.map