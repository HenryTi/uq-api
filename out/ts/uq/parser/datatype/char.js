"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PChar = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
class PChar extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE)
            return;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.NUM)
            this.expect('整数');
        if (!this.ts.isInteger)
            this.expect('整数');
        this.dt.size = this.ts.dec;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.RPARENTHESE)
            this.expectToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
    }
}
exports.PChar = PChar;
//# sourceMappingURL=char.js.map