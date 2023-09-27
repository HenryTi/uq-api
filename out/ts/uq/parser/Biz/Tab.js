"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTab = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTab extends Base_1.PBizEntity {
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
        };
        // const keys = Object.keys(keyColl);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.parseProp();
                // this.ts.expect(...keys);
                continue;
            }
            this.ts.readToken();
            parse();
        }
    }
}
exports.PBizTab = PBizTab;
//# sourceMappingURL=Tab.js.map