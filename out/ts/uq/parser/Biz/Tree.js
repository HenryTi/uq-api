"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTree = void 0;
const Base_1 = require("./Base");
class PBizTree extends Base_1.PBizEntity {
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
}
exports.PBizTree = PBizTree;
//# sourceMappingURL=Tree.js.map