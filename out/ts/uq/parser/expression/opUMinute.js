"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpUMinute = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpUMinute extends element_1.PElement {
    constructor(opUMinute, context) {
        super(opUMinute, context);
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.RPARENTHESE) {
            this.ts.readToken();
            return;
        }
        this.stamp = new il_1.ValueExpression();
        this.stamp.parser(this.context).parse();
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        if (this.stamp && this.stamp.pelement) {
            if (this.stamp.pelement.scan(space) === true) {
                this.element.stamp = this.stamp;
            }
            else {
                ok = false;
            }
        }
        return ok;
    }
}
exports.POpUMinute = POpUMinute;
//# sourceMappingURL=opUMinute.js.map