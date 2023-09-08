import { BizBud, BizBudAtom, BizBudChar, BizBudCheck, BizBudDate, BizBudDec, BizBudID, BizBudInt, BizBudOptions, BizBudNone, BizBudRadio, BizBudSubItems, Uq } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase } from "./Base";

export abstract class PBizBud<P extends BizBud> extends PBizBase<P> {
    protected get defaultName(): string { return undefined; }
    protected _parse(): void {
    }

    scan(space: Space): boolean {
        let ok = true;
        return ok;
    }
}

export class PBizBudNone extends PBizBud<BizBudNone> {
    protected _parse(): void {
    }
}

export class PBizBudInt extends PBizBud<BizBudInt> {
    protected _parse(): void {
    }
}

export class PBizBudDec extends PBizBud<BizBudDec> {
    protected _parse(): void {
    }
}

export class PBizBudChar extends PBizBud<BizBudChar> {
    protected _parse(): void {
    }
}

export class PBizBudDate extends PBizBud<BizBudDate> {
    protected _parse(): void {
    }
}

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

export class PBizBudAtom extends PBizBud<BizBudAtom> {
    private atomName: string;
    protected _parse(): void {
        if (this.ts.token === Token.VAR) {
            this.atomName = this.ts.lowerVar;
            this.ts.readToken();
        }
    }

    scan(space: Space): boolean {
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

class PBizBudSubItems<T extends BizBudSubItems> extends PBizBud<T> {
    protected _parse(): void {
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.assertToken(Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let caption: string;
            if (this.ts.token === Token.STRING) {
                caption = this.ts.text;
                this.ts.readToken();
            }
            let value: string | number;
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                switch (this.ts.token as any) {
                    default: this.ts.expect('number', 'string'); break;
                    case Token.NUM: value = this.ts.dec; break;
                    case Token.STRING: value = this.ts.text; break;
                }
                this.ts.readToken();
            }
            this.element.items.push({ name, caption, value });
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
            }
        }
    }
}

export class PBizBudItems extends PBizBudSubItems<BizBudOptions> {
}

abstract class PBizBudRadioOrCheck<T extends (BizBudRadio | BizBudCheck)> extends PBizBudSubItems<T> {
    protected _parse(): void {
        if (this.ts.token !== Token.VAR) {
            super._parse();
            return;
        }
        this.element.budOptionsName = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan2(uq: Uq): boolean {
        const { budOptionsName } = this.element;
        if (budOptionsName === undefined) return true;
        let budOptions = uq.biz.budOptionsMap[budOptionsName];
        if (budOptions === undefined) {
            this.log(`BudOptions ${budOptionsName} not exists`);
            return false;
        }
        this.element.items.push(...budOptions.items);
    }
}

export class PBizBudRadio extends PBizBudRadioOrCheck<BizBudRadio> {
}

export class PBizBudCheck extends PBizBudRadioOrCheck<BizBudCheck> {
}
