import {
    BizBud, BizBudAtom, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, BizBudInt, BizOptions
    , BizBudNone, BizBudRadio, BizBudIntOf, BizBudPickable, BizPhraseType, BudValueAct, ValueExpression, BizBudValue, BizQueryValue, Uq, BizEntity, BizBin
} from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase } from "./Base";

export abstract class PBizBud<P extends BizBud> extends PBizBase<P> {
}

export abstract class PBizBudValue<P extends BizBudValue> extends PBizBud<P> {
    protected _parse(): void {
    }

    protected scanBudValue(space: Space) {
        let ok = true;

        let { value } = this.element;
        if (value !== undefined) {
            const { exp, show } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (show !== undefined) {
                let ret = space.getBin();
                if (ret === undefined) {
                    let [bud, prop] = show;
                    this.log(`${bud}.${prop} : can only be defined in BIN`);
                    ok = false;
                }
                else {
                    value.show = [...show, ret] as any;
                }
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            const { exp } = value;
            if (exp !== undefined) {
                if (exp.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (this.scanBudValue(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        let { value } = this.element;
        if (value !== undefined) {
            const { show } = value;
            if (show !== undefined) {
                let [bud, prop, bin] = show as unknown as [string, string, BizBin];
                let bizEntity = bin.getBinBudEntity(bud);
                if (bizEntity === undefined) {
                    this.log(`${bud} is not defined in ${bin.getJName()} or is not an ATOM`);
                    ok = false;
                }
                else {
                    let bud = bizEntity.getBud(prop);
                    if (bud === undefined) {
                        this.log(`${bizEntity.getJName()} has not ${prop}`);
                        ok = false;
                    }
                    else {
                        value.show = [bizEntity, bud];
                        let { showBuds } = bin;
                        if (showBuds === undefined) {
                            showBuds = bin.showBuds = {};
                        }
                        showBuds[this.element.name] = value.show;
                    }
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
            // this.element.fraction = n;
            this.element.ui.fraction = n;
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
        this.atomName = this.ts.mayPassVar();
    }

    scan(space: Space): boolean {
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
            this.parseBudEqu(this.element);
        }
        this.ts.expect('Atom', 'Pick', '=', ':=', ':');
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
            if (this.scanBudValue(space) === false) {
                ok = false;
                this.log('should be either Atom or Pick or = or := or :');
            }
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
