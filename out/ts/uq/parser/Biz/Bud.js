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
        this.parseBudEqu();
    }
    parseBudEqu() {
        /*
        let act: BudValueAct;
        switch (this.ts.token) {
            default: return;
            case Token.EQU: act = BudValueAct.equ; break;
            case Token.COLONEQU: act = BudValueAct.init; break;
            case Token.COLON: act = BudValueAct.show; break;
        }
        if (act !== undefined) {
            this.ts.readToken();
            let exp: ValueExpression;
            exp = new ValueExpression();
            this.context.parseElement(exp);
            // }
            bizBud.value = {
                exp,
                act,
            };
        }
        */
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
            let varString = [];
            for (;;) {
                varString.push(this.ts.passVar());
                if (this.ts.token !== tokens_1.Token.DOT)
                    break;
                this.ts.readToken();
            }
            this.fieldString = varString;
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
        }
        return ok;
    }
    bizEntityScan2(bizEntity) {
        let ok = true;
        if (this.fieldString === undefined)
            return ok;
        let len = this.fieldString.length;
        if (len === 1) {
            this.log(`${this.element.name}'s show value can not be one bud`);
            return false;
        }
        let bizBin = bizEntity;
        let show = [];
        let name0 = this.fieldString[0];
        let bizBud0 = bizEntity.getBud(name0);
        if (bizBud0 === undefined) {
            this.log(`${bizEntity.getJName()} has not ${name0}`);
            ok = false;
            return ok;
        }
        else if (bizEntity.bizPhraseType !== il_1.BizPhraseType.bin) {
            this.log('show field can only be in Bin');
            ok = false;
            return ok;
        }
        show.push(il_1.FieldShow.createBinFieldShow(bizBin, bizBud0));
        let p = bizBud0;
        for (let i = 1; i < len; i++) {
            let { dataType } = p;
            let bizBud = undefined;
            let prop = this.fieldString[i];
            switch (dataType) {
                default:
                    this.log(`${p.name} is neither ATOM nor SPEC`);
                    ok = false;
                    return ok;
                case il_1.BudDataType.atom:
                    let { atom } = p;
                    if (atom === undefined) {
                        this.log(`${p.name} does not define ATOM or SPEC`);
                        ok = false;
                        return ok;
                    }
                    bizBud = atom.getBud(prop);
                    p = bizBud;
                    switch (atom.bizPhraseType) {
                        default:
                            this.log(`${p.name} is neither ATOM nor SPEC`);
                            ok = false;
                            return ok;
                        case il_1.BizPhraseType.atom:
                            if (bizBud === undefined) {
                                this.log(`${atom.getJName()} has not ${prop}`);
                                ok = false;
                                return ok;
                            }
                            show.push(il_1.FieldShow.createAtomFieldShow(atom, bizBud));
                            break;
                        case il_1.BizPhraseType.spec:
                            if (bizBud !== undefined) {
                                show.push(il_1.FieldShow.createSpecFieldShow(atom, bizBud));
                                break;
                            }
                            const { base } = atom;
                            bizBud = base.getBud(prop);
                            p = bizBud;
                            if (bizBud === undefined) {
                                this.log(`${base.getJName()} has not ${prop}`);
                                ok = false;
                                return ok;
                            }
                            show.push(il_1.FieldShow.createSpecAtomFieldShow(atom, bizBud));
                            break;
                    }
                    break;
            }
            if (bizBud === undefined)
                break;
        }
        let { showBuds } = bizBin;
        if (showBuds === undefined) {
            showBuds = bizBin.showBuds = {};
        }
        showBuds[this.element.name] = show;
        return ok;
    }
}
exports.PBizBudValue = PBizBudValue;
class PBizBudNone extends PBizBudValue {
}
exports.PBizBudNone = PBizBudNone;
class PBizBudInt extends PBizBudValue {
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
        this.parseBudEqu();
    }
}
exports.PBizBudDec = PBizBudDec;
class PBizBudChar extends PBizBudValue {
}
exports.PBizBudChar = PBizBudChar;
class PBizBudDate extends PBizBudValue {
}
exports.PBizBudDate = PBizBudDate;
class PBizBudAtom extends PBizBudValue {
    _parse() {
        this.atomName = this.ts.mayPassVar();
        this.parseBudEqu();
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.atomName !== undefined) {
            let atom = super.scanAtomID(space, this.atomName);
            if (atom === undefined) {
                ok = false;
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
            this.parseBudEqu();
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