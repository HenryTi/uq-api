"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PText = void 0;
const tokens_1 = require("../tokens");
const datatype_1 = require("./datatype");
const textTypes = ['tiny', 'small', 'medium', 'big', 'long'];
class PText extends datatype_1.PDataType {
    constructor(dt, context) {
        super(dt, context);
        this.dt = dt;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.dt.size = '';
            return true;
        }
        this.ts.readToken();
        if (textTypes.indexOf(this.ts.lowerVar) < 0) {
            this.expect(...textTypes);
            return false;
        }
        let v = this.ts._var;
        switch (v) {
            case 'long':
                v = 'big';
                break;
            case 'small':
                v = '';
                break;
        }
        this.dt.size = v; // === 'small'? '':v;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
}
exports.PText = PText;
//# sourceMappingURL=text.js.map