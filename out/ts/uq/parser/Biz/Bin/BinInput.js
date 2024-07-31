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
    constructor() {
        super(...arguments);
        this.params = [];
    }
    _parse() {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        this.ts.passToken(tokens_1.Token.EQU);
        let val = this.element.baseValue = new il_1.ValueExpression();
        this.context.parseElement(val);
        for (;;) {
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
            let p = this.ts.passVar();
            let valueSetType;
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.EQU, tokens_1.Token.COLONEQU);
                    break;
                case tokens_1.Token.COLONEQU:
                    valueSetType = il_1.BudValueSetType.init;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.EQU:
                    valueSetType = il_1.BudValueSetType.equ;
                    this.ts.readToken();
                    break;
            }
            let pv = new il_1.ValueExpression();
            this.context.parseElement(pv);
            this.params.push([p, pv, valueSetType]);
        }
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
            let fork = this.element.fork = ret;
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
            else {
                const { params } = this.element;
                for (let [name, v, valueSetType] of this.params) {
                    let bud = fork.getBud(name);
                    if (bud === undefined) {
                        ok = false;
                        this.log(`${name} is not a bud of ${fork.getJName()}`);
                        continue;
                    }
                    if (v.pelement.scan(space) === false) {
                        ok = false;
                    }
                    params.push([bud, v, valueSetType]);
                }
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