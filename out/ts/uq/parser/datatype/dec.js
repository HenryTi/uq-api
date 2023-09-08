"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDec = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
class PDec extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        dt.precision = 10;
        dt.scale = 2;
        this.dt = dt;
    }
    sizeError(size, ...more) {
        this.error('decimal size error: ' + size, ...more);
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE)
            return;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.NUM || !this.ts.isInteger)
            this.expect('整数');
        this.dt.precision = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.RPARENTHESE) {
            this.ts.readToken();
            return;
        }
        if (this.ts.token !== tokens_1.Token.COMMA)
            this.expectToken(tokens_1.Token.COMMA);
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.NUM || !this.ts.isInteger)
            this.expect('整数');
        this.dt.scale = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.RPARENTHESE)
            this.expectToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
    }
}
exports.PDec = PDec;
//# sourceMappingURL=dec.js.map