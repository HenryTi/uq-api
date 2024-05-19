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
    // private equBud: string;
    _parse() {
        this.spec = this.ts.passVar();
        this.ts.passKey('base');
        /*
        if (this.ts.token === Token.EQU) {
            this.ts.passToken(Token.EQU);
            this.element.baseValue = new ValueExpression();
            const { baseValue } = this.element;
            this.context.parseElement(baseValue);
        }
        else {
        */
        this.ts.passToken(tokens_1.Token.EQU);
        let val = this.element.baseValue = new il_1.ValueExpression();
        this.context.parseElement(val);
        // this.ts.passKey('on');
        /*
        let v = this.ts.passVar();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.ts.passKey('base');
            switch (v) {
                default: this.ts.expect('I or X'); break;
                case 'i': this.equBud = '.i'; break;
                case 'x': this.equBud = '.x'; break;
            }
        }
        else {
            this.equBud = v;
        }
        */
        // }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        let [ret] = space.getBizEntityArr(this.spec);
        if (ret?.bizPhraseType !== BizPhraseType_1.BizPhraseType.spec) {
            this.log(`${this.spec} is not SPEC`);
            ok = false;
        }
        else {
            this.element.spec = ret;
            /*
            if (this.equBud !== undefined) {
                let bud = this.element.bin.getBud(this.equBud);
                if (bud === undefined) {
                    ok = false;
                    this.log(`${this.equBud} not exists`);
                }
                else {
                    this.element.baseBud = bud;
                }
            }
            else {
            */
            let { baseValue } = this.element;
            if (baseValue.pelement.scan(space) === false) {
                ok = false;
            }
            // }
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
        let [ret] = space.getBizEntityArr(this.atom);
        if (ret?.bizPhraseType !== BizPhraseType_1.BizPhraseType.atom) {
            this.log(`${this.atom} is not ATOM`);
            ok = false;
        }
        this.element.atom = ret;
        return ok;
    }
}
exports.PBinInputAtom = PBinInputAtom;
//# sourceMappingURL=BinInput.js.map