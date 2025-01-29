"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPutStatement = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const PStatement_1 = require("../PStatement");
class PPutStatement extends PStatement_1.PStatement {
    _parse() {
        if (this.ts.token === tokens_1.Token.EQU) {
            this.ts.readToken();
        }
        else {
            this.element.putName = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.EQU);
        }
        let val = new il_1.ValueExpression();
        this.context.parseElement(val);
        this.element.val = val;
    }
    scan(space) {
        let ok = true;
        const { val } = this.element;
        if (val.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PPutStatement = PPutStatement;
//# sourceMappingURL=put.js.map