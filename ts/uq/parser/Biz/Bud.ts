import {
    BizBud, BizBudAtom, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, BizBudInt, BizOptions
    , BizBudNone, BizBudRadio, BizBudIntOf, BizBudPickable, BizPhraseType, BudValueAct, ValueExpression, BizBudValue, BizQueryValue
} from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase } from "./Base";

export abstract class PBizBud<P extends BizBud> extends PBizBase<P> {
}

export abstract class PBizBudValue<P extends BizBudValue> extends PBizBud<P> {
    protected _parse(): void {
    }

    scan(space: Space): boolean {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            const { exp, query } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            else if (query !== undefined) {
                if (query.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}

export class PBizBudNone extends PBizBudValue<BizBudNone> {
    protected _parse(): void {
    }
}

export class PBizBudInt extends PBizBudValue<BizBudInt> {
    protected _parse(): void {
    }
}

export class PBizBudDec extends PBizBudValue<BizBudDec> {
    protected _parse(): void {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            if (this.ts.token !== Token.NUM as any) {
                this.ts.expectToken(Token.NUM);
            }
            let n = this.ts.dec;
            this.ts.readToken();
            let f: number = undefined;
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.NUM as any) {
                    this.ts.expectToken(Token.NUM);
                }
                f = this.ts.dec;
                this.ts.readToken();
            }
            this.ts.passToken(Token.RPARENTHESE);
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
            this.element.fraction = n;
        }
    }
}

export class PBizBudChar extends PBizBudValue<BizBudChar> {
    protected _parse(): void {
    }
}

export class PBizBudDate extends PBizBudValue<BizBudDate> {
    protected _parse(): void {
    }
}
export class PBizBudAtom extends PBizBudValue<BizBudAtom> {
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

export class PBizBudPickable extends PBizBudValue<BizBudPickable> {
    // private atom: string;
    private pick: string;
    protected _parse(): void {
        if (this.ts.token === Token.VAR) {
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
            let act: BudValueAct;
            switch (this.ts.token) {
                case Token.EQU:
                    act = BudValueAct.equ;
                    break;
                case Token.COLONEQU:
                    act = BudValueAct.init;
                    break;
            }
            if (act !== undefined) {
                this.ts.readToken();
                let exp: ValueExpression;
                let query: BizQueryValue;
                if (this.ts.token === Token.LBRACE) {
                    query = new BizQueryValue(this.element.biz);
                    this.context.parseElement(query);
                }
                else {
                    exp = new ValueExpression();
                    this.context.parseElement(exp);
                }
                this.element.value = {
                    exp,
                    act,
                    query,
                };
                return;
            }
        }
        this.ts.expect('Atom', 'Pick', '=', ':=');
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        if (this.pick !== undefined) {
            let pick = this.getBizEntity(space, this.pick);
            if (pick !== undefined) {
                let { bizPhraseType } = pick;
                if (bizPhraseType === BizPhraseType.pick || bizPhraseType === BizPhraseType.atom) {
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
                const { exp, query } = value;
                if (exp !== undefined) {
                    if (exp.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                else if (query !== undefined) {
                    if (query.pelement.scan(space) === false) {
                        ok = false;
                    }
                }
                return ok;
            }
            ok = false;
            this.log('should be either Atom or Pick or = or :=');
        }
    }
}

abstract class PBizBudRadioOrCheck<T extends (BizBudRadio | BizBudCheck | BizBudIntOf)> extends PBizBudValue<T> {
    private optionsName: string;

    protected _parse(): void {
        if (this.ts.token !== Token.VAR) {
            super._parse();
            return;
        }
        this.optionsName = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space: Space): boolean {
        const { optionsName } = this;
        if (optionsName === undefined) return true;
        let options = space.uq.biz.bizEntities.get(optionsName);
        if (options === undefined) {
            this.log(`Options ${optionsName} not exists`);
            return false;
        }
        if (options.type !== 'options') {
            this.log(`${optionsName} is not an Options`);
            return false;
        }
        this.element.options = options as BizOptions;
    }
}

export class PBizBudIntOf extends PBizBudRadioOrCheck<BizBudIntOf> {
}

export class PBizBudRadio extends PBizBudRadioOrCheck<BizBudRadio> {
}

export class PBizBudCheck extends PBizBudRadioOrCheck<BizBudCheck> {
}
