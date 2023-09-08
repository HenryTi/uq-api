"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POf = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
class POf extends datatype_1.PDataType {
    constructor(of, context) {
        super(of, context);
        this.of = of;
    }
    _parse() {
        this.ts.assertToken(tokens_1.Token.VAR);
        this.of.owner = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.DOT);
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.VAR);
        this.of.arr = this.ts.lowerVar;
        this.ts.readToken();
    }
}
exports.POf = POf;
//# sourceMappingURL=of.js.map