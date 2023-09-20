"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTree = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTree extends Base_1.PBizEntity {
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
            // assign: this.parseAssign,
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
}
exports.PBizTree = PBizTree;
//# sourceMappingURL=Tree.js.map