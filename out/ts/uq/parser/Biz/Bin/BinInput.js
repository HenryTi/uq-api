"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBinInputAtom = exports.PBinInputSpec = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const Bud_1 = require("../Bud");
class PBinInput extends Bud_1.PBizBud {
}
class PBinInputSpec extends PBinInput {
    _parse() {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        this.ts.passToken(tokens_1.Token.EQU);
        this.element.baseValue = new il_1.ValueExpression();
        const { baseValue } = this.element;
        this.context.parseElement(baseValue);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PBinInputSpec = PBinInputSpec;
class PBinInputAtom extends PBinInput {
    _parse() {
        this.atom = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PBinInputAtom = PBinInputAtom;
//# sourceMappingURL=BinInput.js.map