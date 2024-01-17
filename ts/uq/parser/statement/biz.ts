import { Space } from '../space';
import {
    BizStatementPend, BizStatementSub
    , BizStatementTitle, BizPend, ValueExpression
    , SetEqu, BizBudValue, BizBin, BizStatement, BizStatementBin, BizStatementIn
    , BizAct, BizBinAct, BizInAct, BizStatementBinPend, BizStatementInPend, BizStatementSheet, BizStatementDetail, BizPhraseType, BizSheet, BizStatementSheetBase, VarPointer, BizStatementID, BizStatementAtom, BizStatementSpec, BizEntity, BizAtom, BizSpec, BizStatementOut, UseOut, BizBudArr
} from '../../il';
import { PStatement } from './statement';
import { PContext } from '../pContext';
import { PElement } from '../element';
import { Token } from '../tokens';
import { BudDataType } from '../../il';
import { binFieldArr } from '../../consts';

export abstract class PBizStatement<A extends BizAct, T extends BizStatement<A>> extends PStatement {
    bizStatement: T;
    private readonly bizSubs: { [key: string]: new (bizStatement: T) => BizStatementSub<A> } = {
        title: BizStatementTitle,
        sheet: BizStatementSheet,
        detail: BizStatementDetail,
        out: BizStatementOut,
    }
    constructor(bizStatement: T, context: PContext) {
        super(bizStatement, context);
        this.bizStatement = bizStatement;
        this.init();
    }

    private init() {
        let ex = this.getBizSubsEx();
        for (let i in ex) {
            this.bizSubs[i] = ex[i];
        }
    }

    protected abstract getBizSubsEx(): { [key: string]: new (bizStatement: T) => BizStatementSub<A> };

    protected _parse() {
        let key = this.ts.passKey();
        let BizSub = this.bizSubs[key];
        if (BizSub === undefined) {
            this.ts.expect(...Object.keys(this.bizSubs));
        }
        let bizSub = new BizSub(this.bizStatement);
        this.context.parseElement(bizSub);
        this.bizStatement.sub = bizSub;
        this.ts.passToken(Token.SEMICOLON);
    }

    scan0(space: Space): boolean {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan0(space) == false) ok = false;
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        let { sub } = this.bizStatement;
        if (sub.pelement.scan(space) == false) ok = false;
        return ok;
    }
}

export class PBizStatementBin extends PBizStatement<BizBinAct, BizStatementBin> {
    protected getBizSubsEx() {
        return {
            pend: BizStatementBinPend,
        };
    }
}

export class PBizStatementIn extends PBizStatement<BizInAct, BizStatementIn> {
    protected getBizSubsEx() {
        return {
            atom: BizStatementAtom,
            spec: BizStatementSpec,
        };
    }
}

abstract class PBizStatementSub<A extends BizAct, T extends BizStatementSub<A>> extends PElement<T> {
}

export abstract class PBizStatementPend<A extends BizAct> extends PBizStatementSub<A, BizStatementPend<A>> {
    protected pend: string;
    private sets: { [v: string]: ValueExpression };

    protected _parse(): void {
        let setEqu: SetEqu;
        if (this.ts.token === Token.VAR) {
            this.pend = this.ts.passVar();
            if (this.ts.isKeyword('set') === true) {
                this.sets = {};
                this.ts.passKey('set');
                for (; ;) {
                    let v = this.ts.passVar();
                    this.ts.passToken(Token.EQU);
                    let exp = new ValueExpression();
                    this.context.parseElement(exp);
                    this.sets[v] = exp;
                    let { token } = this.ts;
                    if (token === Token.COMMA as any) {
                        this.ts.readToken();
                        continue;
                    }
                    if (token === Token.SEMICOLON as any) {
                        break;
                    }
                    this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
                }
            }
        }
        else {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.EQU, Token.ADDEQU, Token.SUBEQU);
                    break;
                case Token.EQU: setEqu = SetEqu.equ; break;
                case Token.ADDEQU: setEqu = SetEqu.add; break;
                case Token.SUBEQU: setEqu = SetEqu.sub; break;
            }
            this.ts.readToken();
            this.element.setEqu = setEqu;
            this.element.val = this.context.parse(ValueExpression);
        }
    }

    private getPend(space: Space, pendName: string): BizPend {
        let pend = space.uq.biz.bizEntities.get(pendName);
        if (pend === undefined) {
            this.log(`'${this.pend}' is not defined`);
            return undefined;
        }
        if (pend.type !== 'pend') {
            this.log(`'${this.pend}' is not a PEND`);
            return undefined;
        }
        return pend as BizPend;
    }

    scan0(space: Space): boolean {
        let ok = true;
        let bizBin = space.getBizEntity(undefined) as BizBin;
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend !== undefined) {
                pend.bizBins.push(bizBin);
            }
        }
        return ok;
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.pend !== undefined) {
            let pend = this.getPend(space, this.pend);
            if (pend === undefined) {
                ok = false;
            }
            else {
                this.element.pend = pend;
                if (this.sets !== undefined) {
                    let { sets } = this.element;
                    for (let i in this.sets) {
                        let bud = pend.getBud(i);
                        if (bud === undefined) {
                            ok = false;
                            this.log(`There is no ${i.toUpperCase()} in Pend ${pend.jName}`);
                        }
                        else {
                            let exp = this.sets[i];
                            if (exp.pelement.scan(space) === false) {
                                ok = false;
                            }
                            else {
                                sets.push([bud, exp]);
                            }
                        }
                    }
                }
            }
        }
        return ok;
    }
}

export class PBizStatementBinPend extends PBizStatementPend<BizBinAct> {
    scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        let { val, bizStatement: { bizAct } } = this.element;
        if (this.pend === undefined) {
            const { bizBin } = bizAct;
            if (bizBin.pend === undefined) {
                this.log(`Biz Pend = can not be used here when ${bizBin.getJName()} has no PEND`);
                ok = false;
            }
            if (val !== undefined) {
                if (val.pelement.scan(space) === false) ok = false;
            }
        }
        return ok;
    }
}

export class PBizStatementInPend extends PBizStatementPend<BizInAct> {
}

export class PBizStatementTitle extends PBizStatementSub<BizAct, BizStatementTitle> {
    private buds: string[];

    protected _parse(): void {
        this.buds = [];
        for (; ;) {
            this.buds.push(this.ts.passVar());
            if (this.ts.token !== Token.DOT) break;
            this.ts.readToken();
        }
        this.ts.passKey('of');
        this.element.of = this.context.parse(ValueExpression);
        switch (this.ts.token) {
            default: this.ts.expectToken(Token.ADDEQU, Token.SUBEQU); break;
            case Token.EQU: this.element.setEqu = SetEqu.equ; break;
            case Token.ADDEQU: this.element.setEqu = SetEqu.add; break;
            case Token.SUBEQU: this.element.setEqu = SetEqu.sub; break;
        }
        this.ts.readToken();
        this.element.val = this.context.parse(ValueExpression);
    }

    scan(space: Space): boolean {
        let ok = true;
        let { val, of, setEqu } = this.element;
        let len = this.buds.length;
        let buds0 = this.buds[0];
        let entity = space.uq.biz.bizEntities.get(buds0);
        if (entity === undefined) {
            this.log(`'${buds0}' is not a Biz Entity`);
            ok = false;
            return ok;
        }
        if (len !== 2) {
            this.log(`'There must be a bud of ${buds0}`);
            ok = false;
            return ok;
        }
        let buds1 = this.buds[1];
        let bud = entity.getBud(buds1);
        if (bud === undefined) {
            this.log(`'${buds0}.${buds1}' not defined`);
            ok = false;
            return ok;
        }
        this.element.entity = entity;
        this.element.bud = bud as BizBudValue;
        let { dataType } = bud;
        if (setEqu === SetEqu.add || setEqu === SetEqu.sub) {
            if (dataType !== BudDataType.int && dataType !== BudDataType.dec) {
                this.log('only int or dec support += or -=');
                ok = false;
            }
        }
        if (val !== undefined) {
            if (val.pelement.scan(space) === false) ok = false;
        }
        if (of !== undefined) {
            if (of.pelement.scan(space) === false) ok = false;
        }
        return ok;
    }
}

abstract class PBizStatementSheetBase<A extends BizAct, T extends BizStatementSheetBase<A>> extends PBizStatementSub<A, T> {
    private readonly sets: { [name: string]: ValueExpression } = {};
    protected parseSet() {
        this.ts.passKey('set');
        for (; ;) {
            let name = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.sets[name] = val;
            if (this.ts.token === Token.SEMICOLON) break;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
        }
    }

    protected scanSets(space: Space): boolean {
        let ok = true;
        const { bin, fields, buds } = this.element;
        const { props } = bin;
        for (let i in this.sets) {
            let val = this.sets[i];
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (binFieldArr.findIndex(v => v === i) >= 0) {
                fields[i] = val;
                continue;
            }
            if (props.has(i) === true) {
                buds[i] = val;
                continue;
            }
            ok = false;
            this.log(`${i} is not defined in ${bin.getJName()}`);
        }
        return ok;
    }
}

export class PBizStatementSheet extends PBizStatementSheetBase<BizAct, BizStatementSheet> {
    private sheet: string;
    private id: string;
    protected _parse(): void {
        this.sheet = this.ts.passVar();
        this.ts.passKey('to');
        this.id = this.ts.passVar();
        this.parseSet();
    }

    override scan(space: Space): boolean {
        let ok = true;
        let sheet = space.getBizEntity<BizSheet>(this.sheet);
        if (sheet === undefined || sheet.bizPhraseType !== BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not a SHEET`);
        }
        this.element.sheet = sheet;
        this.element.bin = sheet.main;
        let pointer = space.varPointer(this.id, false) as VarPointer;
        if (pointer === undefined) {
            ok = false;
            this.log(`没有定义${this.id}`);
        }
        else {
            pointer.name = this.id;
        }
        this.element.idPointer = pointer;
        if (this.scanSets(space) === false) ok = false;
        return ok;
    }
}

export class PBizStatementDetail extends PBizStatementSheetBase<BizAct, BizStatementDetail> {
    private sheet: string;
    private detail: string;
    protected _parse(): void {
        this.detail = this.ts.passVar();
        this.ts.passKey('of');
        this.sheet = this.ts.passVar();
        this.ts.passToken(Token.EQU);
        this.element.idVal = new ValueExpression();
        let { idVal } = this.element;
        this.context.parseElement(idVal);
        this.parseSet();
    }

    override scan(space: Space): boolean {
        let ok = true;
        let sheet = space.getBizEntity<BizSheet>(this.sheet);
        if (sheet === undefined || sheet.bizPhraseType !== BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not a SHEET`);
        }
        else {
            this.element.sheet = sheet;
            let getDetail = (): BizBin => {
                let bin = space.getBizEntity<BizBin>(this.detail);
                if (bin === undefined) return;
                for (let detail of sheet.details) {
                    if (detail.bin === bin) return bin;
                }
                return undefined;
            }
            this.element.bin = getDetail();
            let { bin } = this.element;
            if (bin === undefined) {
                ok = false;
                this.log(`${this.detail} is not a detail of SHEET ${this.sheet}`);
            }
        }
        if (this.scanSets(space) === false) ok = false;
        let { idVal } = this.element;
        if (idVal.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

abstract class PBizStatementID<A extends BizAct, T extends BizStatementID<A>> extends PBizStatementSub<A, T> {
    protected entityName: string;
    protected entity: BizEntity;
    protected toVar: string;
    protected inVals: ValueExpression[] = [];
    protected override _parse(): void {
        this.entityName = this.ts.passVar();
        this.ts.passKey('in');
        this.ts.passToken(Token.EQU);
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                let val = new ValueExpression();
                this.context.parseElement(val);
                this.inVals.push(val);
                const { token } = this.ts;
                if (token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        else {
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.inVals.push(val);
        }
        this.ts.passKey('to');
        this.toVar = this.ts.passVar();
    }

    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
        }
        this.entity = space.getBizEntity(this.entityName);
        if (this.entity === undefined) {
            ok = false;
            this.log(`${this.entityName} is not defined`);
        }
        this.element.toVar = space.varPointer(this.toVar, false) as VarPointer;
        if (this.element.toVar === undefined) {
            ok = false;
            this.log(`${this.toVar} is not defined`);
        }
        for (let inVal of this.inVals) {
            if (inVal.pelement.scan(space) === false) {
                ok = false;
            }
        }
        this.element.inVals = this.inVals;
        return ok;
    }
}

export class PBizStatementAtom<A extends BizAct, T extends BizStatementAtom<A>> extends PBizStatementID<A, T> {
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entity.bizPhraseType !== BizPhraseType.atom) {
            ok = false;
            this.log(`${this.entityName} is not ATOM`);
        }
        else {
            this.element.atom = this.entity as BizAtom;
        }
        let { length } = this.inVals;
        if (length !== 1) {
            ok = false;
            this.log(`IN ${length} variables, can only have 1 variable`);
        }
        return ok;
    }
}

export class PBizStatementSpec<A extends BizAct, T extends BizStatementSpec<A>> extends PBizStatementID<A, T> {
    override scan(space: Space): boolean {
        let ok = true;
        if (super.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (this.entity.bizPhraseType !== BizPhraseType.spec) {
            ok = false;
            this.log(`${this.entityName} is not SPEC`);
        }
        else {
            this.element.spec = this.entity as BizSpec;
            let length = this.element.spec.keys.length + 1;
            if (length !== this.inVals.length) {
                ok = false;
                this.log(`IN ${this.inVals.length} variables, must have ${length} variables`);
            }
        }
        return ok;
    }
}

export class PBizStatementOut<A extends BizAct, T extends BizStatementOut<A>> extends PBizStatementSub<A, T> {
    private varName: string;
    protected override _parse(): void {
        this.varName = this.ts.passVar();
        if (this.ts.isKeyword('add') === true) {
            this.ts.readToken();
            this.element.detail = this.ts.passVar();
        }
        this.ts.passKey('set');
        for (; ;) {
            let name = this.ts.passVar();
            this.ts.passToken(Token.EQU);
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.element.sets[name] = val;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === Token.SEMICOLON) {
                break;
            }
            this.ts.expectToken(Token.COMMA, Token.SEMICOLON);
        }
    }
    override scan(space: Space): boolean {
        let ok = true;
        let { detail, sets } = this.element;
        let useOut: UseOut;
        let useRet = space.getUse(this.varName);
        if (useRet === undefined) {
            ok = false;
            this.log(`${this.varName} is not defined`);
        }
        else {
            useOut = useRet.obj as UseOut;
            if (useOut.type !== 'out') {
                ok = false;
                this.log(`USE OUT ${this.varName} is not exists`);
            }
            else {
                this.element.useOut = useOut;
                let { outEntity } = useOut;
                let { props } = outEntity;
                if (detail !== undefined) {
                    let arr = outEntity.props.get(detail) as BizBudArr;
                    if (arr === undefined || arr.dataType !== BudDataType.arr) {
                        ok = false;
                        this.log(`${detail} is not a ARR of ${outEntity.getJName()}`);
                    }
                    else {
                        props = arr.props;
                    }
                }
                if (props !== undefined) {
                    for (let i in sets) {
                        if (props.has(i) === false) {
                            ok = false;
                            this.log(`${i} is not defined`);
                        }
                        else if (sets[i].pelement.scan(space) === false) {
                            ok = false;
                        }
                    }
                }
            }
        }
        return ok;
    }
}
