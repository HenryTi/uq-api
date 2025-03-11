import {
    BizBud, BizBudID, BizBudChar, BizBudCheck, BizBudDate
    , BizBudDec, BizBudInt, BizOptions
    , BizBudAny, BizBudRadio, BizBudPickable
    , BudValueSetType, ValueExpression, BizBudValue, BizEntity, BizBin
    , FieldShowItem, BizFork, BudValueSet, BizBudValueWithRange
    , BizBudIXBase, BizBudIDIO, BizBudArr, budClassesOut, budClassKeysOut, UI, BinValue
    , BizBudIDBase,
    BizBudBin,
    BizID,
    BizBudFork,
    BizBudTieable,
    BizIDExtendable,
    BizTie,
    BudIndex,
    EnumSysBud,
    Uq,
    VarOperand,
    BizEntityBudPointer,
    BizBudOptions,
    DotVarPointer
} from "../../il";
import { BizPhraseType, BudDataType } from "../../il/Biz/BizPhraseType";
import { Space } from "../space";
import { Token } from "../tokens";
import { PBizBase } from "./Base";
import { BizEntitySpace } from "./Biz";

export abstract class PBizBud<P extends BizBud> extends PBizBase<P> {
}

export abstract class PBizBudValue<P extends BizBudValue> extends PBizBud<P> {
    private fieldString: string[];
    protected _parse(): void {
        this.parseBudEquValue();
    }

    protected parseBudEquValue() {
        let setType = this.parseBudEqu();
        if (setType === BudValueSetType.show) {
            let varString: string[] = [];
            for (; ;) {
                varString.push(this.ts.passVar());
                if (this.ts.token !== Token.DOT) break;
                this.ts.readToken();
            }
            this.fieldString = varString;
            return;
        }
        if (setType !== undefined) {
            let exp = new ValueExpression();
            this.context.parseElement(exp);
            this.element.value = {
                exp,
                setType,
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
        show.push(bizBud0);
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
                    let { ID: atom } = p as BizBudID;
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
                            show.push(bizBud);
                            break;
                        case BizPhraseType.fork:
                            if (bizBud !== undefined) {
                                //show.push(FieldShowItem.createSpecFieldShow(atom as BizSpec, bizBud));
                                show.push(bizBud);
                                break;
                            }
                            const { base } = atom as BizFork;
                            bizBud = base.getBud(prop);
                            p = bizBud;
                            if (bizBud === undefined) {
                                this.log(`${base.getJName()} has not ${prop}`);
                                return undefined;
                            }
                            // show.push(FieldShowItem.createSpecAtomFieldShow(atom as BizSpec, bizBud));
                            show.push(bizBud);
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

        let fieldShowItems: FieldShowItem[] = this.getFieldShow(bizEntity as BizBin, ...this.fieldString);
        if (fieldShowItems === undefined) {
            ok = false;
        }
        else {
            let bizBin = bizEntity as BizBin;
            let { showBuds } = bizBin;
            if (showBuds === undefined) {
                showBuds = bizBin.showBuds = [];
            }
            showBuds.push(fieldShowItems);
            this.element.ui.show = true;
        }
        return ok;
    }
}

export class PBizBudAny extends PBizBudValue<BizBudAny> {
}

export class PBizBudArr extends PBizBudValue<BizBudArr> {
    protected override _parse(): void {
        let propArr = this.parsePropArr();
        let { props } = this.element;
        this.parsePropMap(props, propArr);
    }
    protected override getBudClass(budClass: string): new (bizEntity: BizEntity, name: string, ui: Partial<UI>) => BizBudValue {
        return budClassesOut[budClass];
    }
    protected override getBudClassKeys() {
        return budClassKeysOut;
    }
    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = super.scan(space);
        const { props } = this.element;
        for (let [, bud] of props) {
            if (bud.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

class PBizBudValueWithRange<T extends BizBudValueWithRange> extends PBizBudValue<T> {
    protected override parseBudEquValue(): void {
        super.parseBudEquValue();
        for (; ;) {
            const { token } = this.ts;
            if (token === Token.GE) {
                if (this.element.min !== undefined) {
                    this.ts.error(`min can be defined more than once`);
                }
                this.ts.readToken();
                let exp = new ValueExpression();
                this.context.parseElement(exp);
                this.element.min = { exp }
            }
            else if (token === Token.LE) {
                if (this.element.max !== undefined) {
                    this.ts.error(`min can be defined more than once`);
                }
                this.ts.readToken();
                let exp = new ValueExpression();
                this.context.parseElement(exp);
                this.element.max = { exp }
            }
            else {
                break;
            }
        }
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = super.scan(space);
        let { min, max } = this.element;
        if (min !== undefined) {
            if (min.exp.pelement.scan(space) === ok) {
                ok = false;
            }
        }
        if (max !== undefined) {
            if (max.exp.pelement.scan(space) === ok) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PBizBudInt extends PBizBudValueWithRange<BizBudInt> {
}

export class PBizBudDec<T extends BizBudDec = BizBudDec> extends PBizBudValueWithRange<T> {
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
        this.parseBudEquValue();
    }
}


export class PBizBudFork extends PBizBudValue<BizBudFork> {
    protected _parse(): void {
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.element.baseBudName = this.ts.passVar();
            this.ts.passToken(Token.RPARENTHESE);
        }
        super._parse();
    }
}

export class PBinValue extends PBizBudDec<BinValue> {
    protected _parse(): void {
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RBRACE as any) {
                    this.ts.readToken();
                    break;
                }
                let name = this.ts.passVar();
                let ui = this.parseUI();
                let bizBudDec = new BizBudDec(this.element.entity, name, ui);
                bizBudDec.parser(this.context).parse();
                this.element.values.push(bizBudDec);
                this.ts.passToken(Token.SEMICOLON);
            }
        }
        super._parse();
    }
    override scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        for (let bud of this.element.values) {
            if (bud.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PBizBudChar extends PBizBudValue<BizBudChar> {
}

export class PBizBudDate extends PBizBudValueWithRange<BizBudDate> {
}

export class PBizBudIDIO extends PBizBud<BizBudIDIO> {
    protected _parse(): void {
    }
    scan(space: BizEntitySpace<BizEntity>): boolean {
        let ok = true;
        return ok;
    }
}

abstract class PBizBudTieable<T extends BizBudTieable> extends PBizBudValue<T> {
    private tie: string;
    private isBud: boolean;
    protected parseTie() {
        if (this.ts.isKeyword('ix') === false) return;
        this.ts.readToken();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.isBud = true;
        }
        this.tie = this.ts.passVar();
        if (this.ts.isKeyword('on') === true) {
            this.ts.readToken();
            let val = new ValueExpression();
            this.element.tieOn = val;
            this.context.parseElement(val);
        }
    }

    protected scanTie(space: Space): boolean {
        let ok = true;
        if (this.tie !== undefined) {
            if (this.isBud === true) {
                let ID = this.getTieID();
                if (ID === undefined) {
                    this.log(`.${this.tie} is not supported here`);
                    ok = false;
                }
                else {
                    let bud = this.element.tie = ID.getBud(this.tie) as BizBud;
                    if (bud === undefined) {
                        this.log(`${this.tie} is not a bud`);
                        ok = false;
                    }
                    else {
                        if ((bud.flag & BudIndex.index) !== BudIndex.index) {
                            this.log(`${this.tie} is not indexed`);
                            ok = false;
                        }
                    }
                }
            }
            else {
                let tie = this.element.tie = space.uq.biz.bizEntities.get(this.tie) as BizTie;
                if (tie === undefined) {
                    this.log(`${this.tie} is not a TIE`);
                    ok = false;
                }
            }
            const { tieOn } = this.element;
            if (tieOn !== undefined) {
                if (tieOn.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }

    protected getTieID(): BizID { return undefined; }
}

abstract class PBizBudIDBase<T extends BizBudIDBase> extends PBizBudTieable<T> {
    protected idName: string;
    private fieldShows: string[][];
    private includeTitleBuds: boolean;
    private includePrimeBuds: boolean;

    protected parseFieldShow() {
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
                switch (this.ts.token as any) {
                    case Token.BITWISEAND:
                        this.includeTitleBuds = true;
                        this.ts.readToken();
                        this.ts.passToken(Token.SEMICOLON);
                        break;
                    case Token.ADD:
                        this.includePrimeBuds = true;
                        this.ts.readToken();
                        this.ts.passToken(Token.SEMICOLON);
                        break;
                    default:
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
                        break;
                }
            }
            else {
                this.ts.expectToken(Token.COLON);
            }
        }
    }

    bizEntityScan2(bizEntity: BizEntity): boolean {
        let ok = super.bizEntityScan2(bizEntity);
        if (this.fieldShows !== undefined) {
            const { fieldShows } = this.element;
            const includeBuds = (bizBuds: BizBud[]) => {
                if (bizBuds === undefined) return;
                for (let bud of bizBuds) fieldShows.push([this.element, bud]);
            }
            if (this.includeTitleBuds === true) {
                includeBuds(this.element.ID?.titleBuds);
            }
            if (this.includePrimeBuds === true) {
                includeBuds(this.element.ID?.primeBuds);
            }
            for (let fieldShow of this.fieldShows) {
                let show = this.getFieldShow(bizEntity as BizBin, this.element.name, ...fieldShow);
                if (show === undefined) {
                    ok = false;
                }
                else {
                    fieldShows.push(show);
                }
            }
        }
        return ok;
    }

    override scan(space: BizEntitySpace<BizEntity>): boolean {
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

    protected override getTieID(): BizID { return this.element.ID; }
}

export class PBizBudIXBase extends PBizBudIDBase<BizBudIXBase> {
    protected _parse(): void {
        this.idName = this.ts.mayPassVar();
        this.parseFieldShow();
    }
}

export class PBizBudID extends PBizBudIDBase<BizBudID> {
    protected _parse(): void {
        this.idName = this.ts.mayPassVar();
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            this.ts.passKey('base');
            this.ts.passToken(Token.EQU);
            let setType = BudValueSetType.equ;
            let exp = new ValueExpression();
            this.context.parseElement(exp);
            let budValue: BudValueSet = {
                exp,
                setType,
            }
            this.element.params['base'] = budValue;
            this.ts.mayPassToken(Token.COMMA);
            this.ts.passToken(Token.RPARENTHESE);
        }
        let required: boolean = undefined;
        if (this.ts.isKeyword('not') === true) {
            this.ts.readToken();
            this.ts.passKey('required');
            required = false;
        }
        else if (this.ts.isKeyword('required') === true) {
            this.ts.readToken();
            required = true;
        }
        this.element.required = this.element.ui.required = required;
        this.parseTie();
        this.parseFieldShow();
        this.parseBudEquValue();
    }

    scan(space: BizEntitySpace): boolean {
        let ok = super.scan(space);
        const { params } = this.element;
        for (let i in params) {
            if (params[i].exp.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (this.scanTie(space) === false) {
            ok = false;
        }
        return ok;
    }
}

type ShowBud = string[];

export class PBizBudBin extends PBizBudValue<BizBudBin> {
    private binName: string;
    private showBuds: ShowBud[] = [];
    protected _parse(): void {
        this.binName = this.ts.mayPassVar();
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                let showBud: ShowBud;
                if (this.ts.token === Token.XOR as any) {
                    this.ts.readToken();
                    let bud = this.ts.passVar();
                    showBud = [undefined, bud];
                }
                else {
                    showBud = [this.ts.passVar()];
                }
                this.showBuds.push(showBud);
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        this.parseBudEquValue();
    }

    override scan0(space: Space): boolean {
        let ok = super.scan0(space);
        if (this.binName === undefined) {
            ok = false;
            this.log(`${this.element.getJName()} does not define BIN`);
        }
        else {
            let bin = space.uq.biz.bizEntities.get(this.binName);
            this.element.bin = bin as BizBin;
            if (bin === undefined || bin.bizPhraseType !== BizPhraseType.bin) {
                ok = false;
                this.log(`${this.binName} is not a BIN`);
            }
        }
        return ok;
    }

    override scan(space: BizEntitySpace): boolean {
        let ok = super.scan(space);
        if (this.showBuds.length === 0) {
            return ok;
        }
        let { bin: bizBin } = this.element;
        if (bizBin === undefined) {
            return false;
        }
        this.element.showBuds = [];
        this.element.sysBuds = [];
        const { showBuds, sysBuds } = this.element;
        for (let showBudName of this.showBuds) {
            let pEntity: BizID = bizBin;
            let bud: BizBud = undefined;
            let arr: BizBud[] = [];
            let [b0, b1] = showBudName;
            if (b0 === undefined) {
                arr.push(undefined);
                pEntity = pEntity.main;
                if (pEntity === undefined) {
                    ok = false;
                    this.log(`${bizBin.getJName()} does not has MAIN`);
                    break;
                }
                b0 = b1;
            }
            switch (b0) {
                case 'no':
                    sysBuds.push(EnumSysBud.sheetNo);
                    this.element.sysNO = true;
                    continue;
                case 'operator': sysBuds.push(EnumSysBud.sheetOperator); continue;
                case 'date': sysBuds.push(EnumSysBud.sheetDate); continue;
            }
            bud = pEntity.getBud(b0);
            if (bud === undefined) {
                ok = false;
                this.log(`${pEntity.getJName()} does not has bud ${b0}`);
                break;
            }
            arr.push(bud);
            showBuds.push(arr);
        }
        return ok;
    }
}

export class PBizBudPickable extends PBizBudValue<BizBudPickable> {
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
            this.parseBudEquValue();
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

abstract class PBizBudRadioOrCheck<T extends (BizBudRadio | BizBudCheck)> extends PBizBudTieable<T> {
    private optionsName: string;

    protected _parse(): void {
        if (this.ts.token !== Token.VAR) {
            super._parse();
            return;
        }
        this.optionsName = this.ts.lowerVar;
        this.ts.readToken();
        this.parseTie();
        this.parseBudEquValue();
    }
    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space as BizEntitySpace) === false) {
            ok = false;
        }
        const { optionsName } = this;
        if (optionsName === undefined) {
            return ok;
        }
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
        if (this.scanTie(space) === false) {
            ok = false;
        }
        return ok;
    }
    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.optionsName === undefined) {
            const { value, name } = this.element;
            if (value === undefined) {
                ok = false;
                this.log(`${name} 没有定义 OPTIONS`);
            }
            else {
                const { exp } = value;
                if (this.setOptions(exp) === false) {
                    ok = false;
                    this.log(`${name} 的表达式必须是 OPTIONS`);
                }
            }
        }
        return ok;
    }

    private setOptions(exp: ValueExpression): boolean {
        const atoms = exp.getAtoms();
        if (atoms.length !== 1) return false;
        const atom = atoms[0] as VarOperand;
        const { pointer } = atom;
        if (pointer === undefined) return false;
        let p = pointer as DotVarPointer;
        if (p.type !== 'dotVarPointer') {
            return false;
        }
        const { bud } = p;
        if (bud === undefined) return false;
        const { element } = this;
        if (element.dataType !== bud.dataType) {
            return false;
        }
        element.options = (bud as BizBudOptions).options;
        return true;
    }
}

export class PBizBudRadio extends PBizBudRadioOrCheck<BizBudRadio> {
}

export class PBizBudCheck extends PBizBudRadioOrCheck<BizBudCheck> {
}
