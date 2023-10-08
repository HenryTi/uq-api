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
    scan(space) {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            if (value.exp.pelement.scan(space) === false) {
                ok = false;
            }
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
/*
export class PBizBudID extends PBizBud<BizBudID> {
    private idName: string;
    protected _parse(): void {
        if (this.ts.token === Token.VAR) {
            this.idName = this.ts.lowerVar;
            this.ts.readToken();
        }
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        if (this.idName !== undefined) {
            let ID = super.scanID(space, this.idName);
            if (ID === undefined) {
                ok = false;
            }
            else {
                this.element.ID = ID;
            }
        }
        return ok;
    }
}
*/
class PBizBudAtom extends PBizBudValue {
    _parse() {
        if (this.ts.token === tokens_1.Token.VAR) {
            this.atomName = this.ts.lowerVar;
            this.ts.readToken();
        }
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.atomName !== undefined) {
            let Item = super.scanAtomID(space, this.atomName);
            if (Item === undefined) {
                ok = false;
            }
            else {
                this.element.atom = Item;
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
            let act;
            switch (this.ts.token) {
                case tokens_1.Token.EQU:
                    act = il_1.BudValueAct.equ;
                    break;
                case tokens_1.Token.COLONEQU:
                    act = il_1.BudValueAct.init;
                    break;
            }
            if (act !== undefined) {
                this.ts.readToken();
                let value = new il_1.ValueExpression();
                this.context.parseElement(value);
                this.element.value = {
                    exp: value,
                    act,
                };
                return;
            }
        }
        this.ts.expect('Atom', 'Pick', '=', ':=');
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
            let { value } = this.element;
            if (value !== undefined) {
                if (value.exp.pelement.scan(space) === false) {
                    ok = false;
                }
                return ok;
            }
            ok = false;
            this.log('should be either Atom or Pick or = or :=');
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