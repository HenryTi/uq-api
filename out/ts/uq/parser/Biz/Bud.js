"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBudCheck = exports.PBizBudRadio = exports.PBizBudIntOf = exports.PBizBudPickable = exports.PBizBudAtom = exports.PBizBudDate = exports.PBizBudChar = exports.PBizBudDec = exports.PBizBudInt = exports.PBizBudNone = exports.PBizBudValue = exports.PBizBud = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizBud extends Base_1.PBizBase {
}
exports.PBizBud = PBizBud;
class PBizBudValue extends PBizBud {
    _parse() {
    }
    parseValue() {
        let act;
        switch (this.ts.token) {
            case tokens_1.Token.EQU:
                act = il_1.BudValueAct.equ;
                break;
            case tokens_1.Token.COLONEQU:
                act = il_1.BudValueAct.init;
                break;
            case tokens_1.Token.COLON:
                act = il_1.BudValueAct.show;
                break;
        }
        if (act === il_1.BudValueAct.show) {
            this.ts.readToken();
            let bud, prop;
            bud = this.ts.passVar();
            this.ts.passToken(tokens_1.Token.DOT);
            prop = this.ts.passVar();
            this.show = [bud, prop];
            this.element.value = {
                exp: undefined,
                act: il_1.BudValueAct.show,
            };
            return;
        }
        if (act !== undefined) {
            this.ts.readToken();
            let exp = new il_1.ValueExpression();
            this.context.parseElement(exp);
            this.element.value = {
                exp,
                act,
            };
            return;
        }
    }
    scanBudValue(space) {
        let ok = true;
        if (this.show !== undefined) {
            let [bud, prop] = this.show;
            let ret = space.getBinBudProp(this.element.name, bud, prop);
            if (ret === undefined) {
                this.log(`${bud}.${prop} is not defined in BIN or ATOM`);
                ok = false;
            }
            else {
                this.element.value.show = ret;
            }
        }
        let { value } = this.element;
        if (value !== undefined) {
            const { exp } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            /*
            else if (query !== undefined) {
                if (query.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            */
        }
        return ok;
    }
    scan(space) {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            const { exp } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            /*
            else if (query !== undefined) {
                if (query.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            */
        }
        return ok;
    }
}
exports.PBizBudValue = PBizBudValue;
class PBizBudNone extends PBizBudValue {
    _parse() {
    }
}
exports.PBizBudNone = PBizBudNone;
class PBizBudInt extends PBizBudValue {
    _parse() {
    }
}
exports.PBizBudInt = PBizBudInt;
class PBizBudDec extends PBizBudValue {
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            let n = this.ts.dec;
            this.ts.readToken();
            let f = undefined;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.NUM) {
                    this.ts.expectToken(tokens_1.Token.NUM);
                }
                f = this.ts.dec;
                this.ts.readToken();
            }
            this.ts.passToken(tokens_1.Token.RPARENTHESE);
            if (f !== undefined) {
                if (Number.isInteger(n) === false || Number.isInteger(f) === false) {
                    this.ts.error('must be integer');
                }
                n = f;
            }
            else {
                if (Number.isInteger(n) === false) {
                    this.ts.error('must be integer');
                }
            }
            if (n < 0 || n > 6) {
                this.ts.error('must be a number between 0-6');
            }
            // this.element.fraction = n;
            this.element.ui.fraction = n;
        }
    }
}
exports.PBizBudDec = PBizBudDec;
class PBizBudChar extends PBizBudValue {
    _parse() {
    }
}
exports.PBizBudChar = PBizBudChar;
class PBizBudDate extends PBizBudValue {
    _parse() {
    }
}
exports.PBizBudDate = PBizBudDate;
class PBizBudAtom extends PBizBudValue {
    _parse() {
        this.atomName = this.ts.mayPassVar();
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.atomName !== undefined) {
            let atom = super.scanAtomID(space, this.atomName);
            if (atom === undefined) {
                // ok = false;
            }
            else {
                this.element.atom = atom;
            }
        }
        return ok;
    }
}
exports.PBizBudAtom = PBizBudAtom;
class PBizBudPickable extends PBizBudValue {
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            if (this.ts.varBrace === false) {
                switch (this.ts.lowerVar) {
                    case 'pick':
                        this.ts.readToken();
                        this.pick = this.ts.passVar();
                        return;
                }
            }
        }
        else {
            this.parseValue();
        }
        this.ts.expect('Atom', 'Pick', '=', ':=', ':');
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.pick !== undefined) {
            let pick = this.getBizEntity(space, this.pick);
            if (pick !== undefined) {
                let { bizPhraseType } = pick;
                if (bizPhraseType === il_1.BizPhraseType.pick || bizPhraseType === il_1.BizPhraseType.atom) {
                    this.element.pick = pick.name;
                    return ok;
                }
            }
            ok = false;
            this.log(`${this.pick} is not Pick`);
            return ok;
        }
        else {
            if (this.scanBudValue(space) === false) {
                ok = false;
                this.log('should be either Atom or Pick or = or := or :');
            }
        }
    }
}
exports.PBizBudPickable = PBizBudPickable;
class PBizBudRadioOrCheck extends PBizBudValue {
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            super._parse();
            return;
        }
        this.optionsName = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space) {
        const { optionsName } = this;
        if (optionsName === undefined)
            return true;
        let options = space.uq.biz.bizEntities.get(optionsName);
        if (options === undefined) {
            this.log(`Options ${optionsName} not exists`);
            return false;
        }
        if (options.type !== 'options') {
            this.log(`${optionsName} is not an Options`);
            return false;
        }
        this.element.options = options;
    }
}
class PBizBudIntOf extends PBizBudRadioOrCheck {
}
exports.PBizBudIntOf = PBizBudIntOf;
class PBizBudRadio extends PBizBudRadioOrCheck {
}
exports.PBizBudRadio = PBizBudRadio;
class PBizBudCheck extends PBizBudRadioOrCheck {
}
exports.PBizBudCheck = PBizBudCheck;
//# sourceMappingURL=Bud.js.map