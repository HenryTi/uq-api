"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBinInputAtom = exports.PBinInputSpec = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const tokens_1 = require("../../tokens");
const Bud_1 = require("../Bud");
class PBinInput extends Bud_1.PBizBud {
}
class PBinInputSpec extends PBinInput {
    _parse() {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        this.ts.passToken(tokens_1.Token.EQU);
        let val = this.element.baseValue = new il_1.ValueExpression();
        this.context.parseElement(val);
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.spec);
        if ((ret === null || ret === void 0 ? void 0 : ret.bizPhraseType) !== BizPhraseType_1.BizPhraseType.fork) {
            this.log(`${this.spec} is not SPEC`);
            ok = false;
        }
        else {
            this.element.spec = ret;
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
        }
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
        let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.atom);
        if ((ret === null || ret === void 0 ? void 0 : ret.bizPhraseType) !== BizPhraseType_1.BizPhraseType.atom) {
            this.log(`${this.atom} is not ATOM`);
            ok = false;
        }
        this.element.atom = ret;
        return ok;
    }
}
exports.PBinInputAtom = PBinInputAtom;
//# sourceMappingURL=BinInput.js.map