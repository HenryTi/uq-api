"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizMoniker = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizMoniker extends Base_1.PBizEntity {
    get defaultName() { return undefined; }
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            assign: this.parseAssign,
        };
        // const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.parseAssign();
                // this.ts.expect(...keys);
                continue;
            }
            this.ts.readToken();
            parse();
        }
    }
}
exports.PBizMoniker = PBizMoniker;
//# sourceMappingURL=Moniker.js.map