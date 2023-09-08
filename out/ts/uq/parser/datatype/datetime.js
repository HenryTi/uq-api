"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDateTime = void 0;
const datatype_1 = require("./datatype");
const tokens_1 = require("../tokens");
class PDateTime extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        dt.precision = 0;
        this.dt = dt;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE)
            return;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.NUM || !this.ts.isInteger)
            this.expect('整数');
        this.dt.precision = this.ts.dec;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
    }
}
exports.PDateTime = PDateTime;
//# sourceMappingURL=datetime.js.map