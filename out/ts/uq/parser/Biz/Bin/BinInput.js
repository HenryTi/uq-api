"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBinInputAtom = exports.PBinInputFork = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const tokens_1 = require("../../tokens");
const Bud_1 = require("../Bud");
class PBinInput extends Bud_1.PBizBud {
}
class PBinInputFork extends PBinInput {
    constructor() {
        super(...arguments);
        this.params = [];
    }
    _parse() {
        if (this.ts.isKeywords('of') === false) {
            this.spec = this.ts.passVar();
        }
        this.ts.passKey('of');
        // this.ts.passToken(Token.EQU);
        let val = this.element.baseValue = new il_1.ValueExpression();
        this.context.parseElement(val);
        switch (this.ts.passKey()) {
            case 'param':
                let valueSetType = this.parseBudEqu();
                let valParam = new il_1.ValueExpression();
                this.context.parseElement(valParam);
                this.params.push([undefined, valParam, valueSetType]);
                break;
            case 'set':
                for (;;) {
                    let p = this.ts.passVar();
                    let valueSetType = this.parseBudEqu();
                    let pv = new il_1.ValueExpression();
                    this.context.parseElement(pv);
                    this.params.push([p, pv, valueSetType]);
                    if (this.ts.token !== tokens_1.Token.COMMA)
                        break;
                    this.ts.readToken();
                }
                break;
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        let { baseValue } = this.element;
        if (baseValue.pelement.scan(space) === false) {
            ok = false;
        }
        if (this.spec !== undefined) {
            let { bizEntityArr: [ret] } = space.getBizFromEntityArrFromName(this.spec);
            if ((ret === null || ret === void 0 ? void 0 : ret.bizPhraseType) !== BizPhraseType_1.BizPhraseType.fork) {
                this.log(`${this.spec} is not SPEC`);
                ok = false;
            }
            else {
                let fork = this.element.fork = ret;
                const { params } = this.element;
                for (let [name, v, valueSetType] of this.params) {
                    let bud;
                    if (name !== undefined) {
                        bud = fork.getBud(name);
                        if (bud === undefined) {
                            ok = false;
                            this.log(`${name} is not a bud of ${fork.getJName()}`);
                            continue;
                        }
                    }
                    if (v.pelement.scan(space) === false) {
                        ok = false;
                    }
                    params.push([bud, v, valueSetType]);
                }
            }
        }
        else {
            const { params } = this.element;
            switch (this.params.length) {
                default:
                    ok = false;
                    this.log(`Only param can set`);
                    break;
                case 0: break;
                case 1:
                    let [name, v, valueSetType] = this.params[0];
                    if (name !== 'param') {
                        ok = false;
                        this.log(`Only PARAM can set`);
                    }
                    else {
                        if (v.pelement.scan(space) === false) {
                            ok = false;
                        }
                        params.push([undefined, v, valueSetType]);
                    }
                    break;
            }
        }
        return ok;
    }
}
exports.PBinInputFork = PBinInputFork;
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