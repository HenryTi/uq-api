import {
    BizBud, BizBudAtom, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, BizBudInt, BizOptions
    , BizBudNone, BizBudRadio, BizBudIntOf, BizBudPickable, BizPhraseType, BudValueAct, ValueExpression, BizBudValue, BizQueryValue, Uq, BizEntity, BizBin, BudDataType, FieldShowItem, BizAtom, BizAtomSpec, BudValue
} from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase } from "./Base";
import { BizEntitySpace } from "./Biz";

export abstract class PBizBud<P extends BizBud> extends PBizBase<P> {
}

export abstract class PBizBudValue<P extends BizBudValue> extends PBizBud<P> {
    private fieldString: string[];
    protected _parse(): void {
        this.parseBudEqu();
    }

    protected parseBudEqu() {
        let act: BudValueAct;
        switch (this.ts.token) {
            case Token.EQU:
                act = BudValueAct.equ;
                break;
            case Token.COLONEQU:
                act = BudValueAct.init;
                break;
            case Token.COLON:
                act = BudValueAct.show;
                break;
        }
        if (act === BudValueAct.show) {
            this.ts.readToken();
            let varString: string[] = [];
            for (; ;) {
                varString.push(this.ts.passVar());
                if (this.ts.token !== Token.DOT) break;
                this.ts.readToken();
            }
            this.fieldString = varString;
            return;
        }
        if (act !== undefined) {
            this.ts.readToken();
            let exp = new ValueExpression();
            this.context.parseElement(exp);
            this.element.value = {
                exp,
                act,
            };
            return;
        }
    }

    scan(space: BizEntitySpace): boolean {
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

    getFieldShow(entity: BizEntity, ...parts: string[]) {
        let show: FieldShowItem[] = [];
        let len = parts.length;
        let name0 = parts[0];
        let bizBud0 = entity.getBud(name0);
        if (bizBud0 === undefined) {
            this.log(`${entity.getJName()} has not ${name0}`);
            return undefined;
        }
        else {
            switch (entity.bizPhraseType) {
                default:
                    this.log('show field can only be in Bin or Pend');
                    return undefined;
                case BizPhraseType.bin:
                case BizPhraseType.pend:
                    break;
            }
        }
        show.push(FieldShowItem.createEntityFieldShow(entity, bizBud0));
        let p = bizBud0;
        for (let i = 1; i < len; i++) {
            let { dataType } = p;
            let bizBud: BizBud = undefined;
            let prop = parts[i];
            switch (dataType) {
                default:
                    this.log(`${p.name} is neither ATOM nor SPEC`);
                    return undefined;
                case BudDataType.atom:
                    let { atom } = p as BizBudAtom;
                    if (atom === undefined) {
                        this.log(`${p.name} does not define ATOM or SPEC`);
                        return undefined;
                    }
                    bizBud = atom.getBud(prop);
                    p = bizBud;
                    switch (atom.bizPhraseType) {
                        default:
                            this.log(`${p.name} is neither ATOM nor SPEC`);
                            return undefined;
                        case BizPhraseType.atom:
                            if (bizBud === undefined) {
                                this.log(`${atom.getJName()} has not ${prop}`);
                                return undefined;
                            }
                            show.push(FieldShowItem.createAtomFieldShow(atom as BizAtom, bizBud));
                            break;
                        case BizPhraseType.spec:
                            if (bizBud !== undefined) {
                                show.push(FieldShowItem.createSpecFieldShow(atom as BizAtomSpec, bizBud));
                                break;
                            }
                            const { base } = atom as BizAtomSpec;
                            bizBud = base.getBud(prop);
                            p = bizBud;
                            if (bizBud === undefined) {
                                this.log(`${base.getJName()} has not ${prop}`);
                                return undefined;
                            }
                            show.push(FieldShowItem.createSpecAtomFieldShow(atom as BizAtomSpec, bizBud));
                            break;
                    }
                    break;
            }
            if (bizBud === undefined) break;
        }
        return show;
    }

    override bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = true;
        if (this.fieldString === undefined) return ok;
        let len = this.fieldString.length;
        if (len === 1) {
            this.log(`${this.element.name}'s show value can not be one bud`);
            return false;
        }

        let show = this.getFieldShow(bizEntity as BizBin, ...this.fieldString);
        if (show === undefined) {
            ok = false;
        }
        else {
            let bizBin = bizEntity as BizBin;
            let { showBuds } = bizBin;
            if (showBuds === undefined) {
                showBuds = bizBin.showBuds = {};
            }
            showBuds[this.element.name] = {
                owner: undefined,
                items: show,
            }
            this.element.ui.show = true;
        }
        return ok;
    }
}

export class PBizBudNone extends PBizBudValue<BizBudNone> {
    //protected _parse(): void {
    // }
}

export class PBizBudInt extends PBizBudValue<BizBudInt> {
    //protected _parse(): void {
    //}
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
            this.element.ui.fraction = n;
        }
        this.parseBudEqu();
    }
}

export class PBizBudChar extends PBizBudValue<BizBudChar> {
    // protected _parse(): void {
    //}
}

export class PBizBudDate extends PBizBudValue<BizBudDate> {
    //protected _parse(): void {
    //}
}
export class PBizBudAtom extends PBizBudValue<BizBudAtom> {
    private atomName: string;
    private fieldShows: string[][];
    protected _parse(): void {
        this.atomName = this.ts.mayPassVar();
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.ts.passKey('base');
            this.ts.passToken(Token.EQU);
            let act = BudValueAct.equ;
            let exp = new ValueExpression();
            this.context.parseElement(exp);
            let budValue: BudValue = {
                exp,
                act,
            }
            this.element.params['base'] = budValue;
            this.ts.mayPassToken(Token.COMMA);
            this.ts.passToken(Token.RPARENTHESE);
        }
        if (this.ts.token === Token.LBRACE) {
            this.parseFieldShow();
        }
        this.parseBudEqu();
    }

    private parseFieldShow() {
        if (this.ts.token !== Token.LBRACE) return;
        this.fieldShows = [];
        this.element.fieldShows = [];
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token === Token.RBRACE as any) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COLON as any) {
                this.ts.readToken();
                let fieldShow: string[] = [];
                for (; ;) {
                    fieldShow.push(this.ts.passVar());
                    if (this.ts.token === Token.SEMICOLON as any) {
                        this.ts.readToken();
                        break;
                    }
                    if (this.ts.token === Token.DOT as any) {
                        this.ts.readToken();
                    }
                }
                this.fieldShows.push(fieldShow);
            }
            else {
                this.ts.expectToken(Token.COLON);
            }
        }
    }

    scan(space: BizEntitySpace): boolean {
        let ok = super.scan(space);
        const { params } = this.element;
        if (this.atomName !== undefined) {
            let atom = super.scanAtomID(space, this.atomName);
            if (atom === undefined) {
                ok = false;
            }
            else {
                this.element.atom = atom;
            }
        }
        for (let i in params) {
            if (params[i].exp.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = super.bizEntityScan2(bizEntity);
        if (this.fieldShows !== undefined) {
            for (let fieldShow of this.fieldShows) {
                let show = this.getFieldShow(bizEntity as BizBin, this.element.name, ...fieldShow);
                if (show === undefined) {
                    ok = false;
                }
                else {
                    this.element.fieldShows.push({
                        owner: this.element,
                        items: show,
                    });
                }
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
            this.parseBudEqu();
        }
        this.ts.expect('Atom', 'Pick', '=', ':=', ':');
    }

    scan(space: BizEntitySpace): boolean {
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
