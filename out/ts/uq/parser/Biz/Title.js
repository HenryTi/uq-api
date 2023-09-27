"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTitle = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizTitle extends Base_1.PBizEntity {
    parseContent() {
        const keyColl = {
            prop: this.parseProp,
        };
        for (;;) {
            if (this.ts.token === tokens_1.Token.RBRACE)
                break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.parseProp();
                continue;
            }
            this.ts.readToken();
            parse();
        }
    }
}
exports.PBizTitle = PBizTitle;
//# sourceMappingURL=Title.js.map