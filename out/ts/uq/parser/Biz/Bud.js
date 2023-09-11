"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizBudCheck = exports.PBizBudRadio = exports.PBizBudItems = exports.PBizBudAtom = exports.PBizBudDate = exports.PBizBudChar = exports.PBizBudDec = exports.PBizBudInt = exports.PBizBudNone = exports.PBizBud = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PBizBud extends Base_1.PBizBase {
    get defaultName() { return undefined; }
    _parse() {
    }
    scan(space) {
        let ok = true;
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
            let Item = super.scanAtom(space, this.atomName);
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
class PBizBudSubItems extends PBizBud {
    _parse() {
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.assertToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let caption;
            if (this.ts.token === tokens_1.Token.STRING) {
                caption = this.ts.text;
                this.ts.readToken();
            }
            this.ts.passToken(tokens_1.Token.EQU);
            if (this.ts.token !== tokens_1.Token.NUM) {
                this.ts.expectToken(tokens_1.Token.NUM);
            }
            if (this.ts.isInteger === false) {
                this.expect('整数');
            }
            let value = this.ts.dec;
            this.ts.readToken();
            this.element.items.push({ name, caption, value });
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
            }
        }
    }
}
class PBizBudItems extends PBizBudSubItems {
}
exports.PBizBudItems = PBizBudItems;
class PBizBudRadioOrCheck extends PBizBudSubItems {
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            super._parse();
            return;
        }
        this.element.budOptionsName = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan2(uq) {
        const { budOptionsName } = this.element;
        if (budOptionsName === undefined)
            return true;
        let budOptions = uq.biz.budOptionsMap[budOptionsName];
        if (budOptions === undefined) {
            this.log(`BudOptions ${budOptionsName} not exists`);
            return false;
        }
        this.element.items.push(...budOptions.items);
    }
}
class PBizBudRadio extends PBizBudRadioOrCheck {
}
exports.PBizBudRadio = PBizBudRadio;
class PBizBudCheck extends PBizBudRadioOrCheck {
}
exports.PBizBudCheck = PBizBudCheck;
//# sourceMappingURL=Bud.js.map