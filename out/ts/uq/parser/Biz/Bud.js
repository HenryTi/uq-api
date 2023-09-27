"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBudCheck = exports.PBizBudRadio = exports.PBizBudIntOf = exports.PBizBudAtom = exports.PBizBudDate = exports.PBizBudChar = exports.PBizBudDec = exports.PBizBudInt = exports.PBizBudNone = exports.PBizBud = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizBud extends Base_1.PBizBase {
    _parse() {
    }
    scan(space) {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizBud = PBizBud;
class PBizBudNone extends PBizBud {
    _parse() {
    }
}
exports.PBizBudNone = PBizBudNone;
class PBizBudInt extends PBizBud {
    _parse() {
    }
}
exports.PBizBudInt = PBizBudInt;
class PBizBudDec extends PBizBud {
    _parse() {
    }
}
exports.PBizBudDec = PBizBudDec;
class PBizBudChar extends PBizBud {
    _parse() {
    }
}
exports.PBizBudChar = PBizBudChar;
class PBizBudDate extends PBizBud {
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
class PBizBudAtom extends PBizBud {
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
class PBizBudRadioOrCheck extends PBizBud {
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